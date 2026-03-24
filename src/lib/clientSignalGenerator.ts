import { analyzeSignal, OHLCV } from './indicators'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAIR_POOL = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT',
  'UNIUSDT', 'ATOMUSDT', 'LTCUSDT', 'NEARUSDT', 'APTUSDT',
  'ARBUSDT', 'OPUSDT', 'INJUSDT', 'SEIUSDT', 'SUIUSDT',
  'TIAUSDT', 'STXUSDT', 'FETUSDT', 'AAVEUSDT', 'MKRUSDT',
]

async function fetchCandlesBrowser(symbol: string): Promise<OHLCV[]> {
  const urls = [
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=250`,
    `https://api1.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=250`,
    `https://api2.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=250`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data) || data.length < 60) continue
      return data.map((k: unknown[]) => ({
        timestamp: Number(k[0]),
        open:   parseFloat(k[1] as string),
        high:   parseFloat(k[2] as string),
        low:    parseFloat(k[3] as string),
        close:  parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
      }))
    } catch { continue }
  }
  return []
}

function sessionId(force = false): string {
  const now  = new Date()
  const slot = Math.floor(now.getUTCHours() / 4)
  const base = `${now.toISOString().split('T')[0]}_slot${slot}`
  return force ? `${base}_forced_${Date.now()}` : base
}

export async function generateSignalsBrowser(
  force = false,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; created: number; message: string; skipped: string[] }> {
  const log = (m: string) => { console.log(m); onProgress?.(m) }
  const sid = sessionId(force)

  if (!force) {
    const { data: existing } = await supabase
      .from('signal_sessions')
      .select('id')
      .eq('session_id', sid)
      .single()
    if (existing) {
      return { success: false, created: 0, message: `Session ${sid} already exists`, skipped: [] }
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayRows } = await supabase
    .from('signals')
    .select('pair')
    .gte('created_at', `${todayStr}T00:00:00Z`)

  const usedToday = new Set((todayRows ?? []).map((r: { pair: string }) => r.pair))
  const available = PAIR_POOL.filter(p => !usedToday.has(p)).sort(() => Math.random() - 0.5)

  log(`Analyzing ${Math.min(15, available.length)} pairs...`)

  const scored: Array<{ pair: string; analysis: NonNullable<ReturnType<typeof analyzeSignal>>; price: number }> = []
  const skipped: string[] = []

  for (const pair of available.slice(0, 15)) {
    log(`Fetching ${pair}...`)
    const candles = await fetchCandlesBrowser(pair)

    if (candles.length < 60) {
      skipped.push(`${pair}: only ${candles.length} candles`)
      log(`${pair}: skipped — insufficient data`)
      continue
    }

    const analysis = analyzeSignal(candles)
    if (!analysis) {
      skipped.push(`${pair}: analysis null`)
      log(`${pair}: skipped — analysis returned null`)
      continue
    }

    const price = candles[candles.length - 1].close
    log(`${pair}: ${analysis.direction} ${analysis.confidence}% | RSI ${analysis.rsi} | ${analysis.emaTrend}`)
    scored.push({ pair, analysis, price })
    await new Promise(r => setTimeout(r, 80))
  }

  if (scored.length === 0) {
    await supabase.from('issue_logs').insert({
      level: 'ERROR', source: 'SIGNALS',
      message: 'Browser generation failed — no valid signals',
      details: { sid, skipped }
    })
    return { success: false, created: 0, message: 'No valid signals found', skipped }
  }

  scored.sort((a, b) => b.analysis.confidence - a.analysis.confidence)
  const top5 = scored.slice(0, 5)
  const sessionEnd = new Date(Date.now() + 4 * 60 * 60 * 1000)

  const rows = top5.map(({ pair, analysis, price }) => ({
    pair,
    symbol:        pair.replace('USDT', ''),
    direction:     analysis.direction,
    timeframe:     '4H',
    entry_price:   price,
    current_price: price,
    tp1: analysis.tp1,
    tp2: analysis.tp2,
    tp3: analysis.tp3,
    sl:  analysis.sl,
    confidence:    analysis.confidence,
    leverage:      analysis.leverage,
    risk_level:    analysis.riskLevel,
    rsi:           analysis.rsi,
    macd_histogram: analysis.macdHistogram,
    ema_trend:     analysis.emaTrend,
    atr:           analysis.atr,
    volume_ratio:  analysis.volumeRatio,
    bb_position:   analysis.bbPosition,
    analysis:      `${analysis.direction} on ${pair} — ${analysis.confidence}% confidence. ${analysis.reasons.slice(0,3).join('. ')}.`,
    reasons:       analysis.reasons,
    session_id:    sid,
    session_start: new Date().toISOString(),
    session_end:   sessionEnd.toISOString(),
    status:        'ACTIVE',
    hit_tp1: false, hit_tp2: false, hit_tp3: false, hit_sl: false,
  }))

  const { error } = await supabase.from('signals').insert(rows)

  if (error) {
    log(`DB error: ${error.message}`)
    return { success: false, created: 0, message: `DB error: ${error.message}`, skipped }
  }

  await supabase.from('signal_sessions').upsert({
    session_id:   sid,
    started_at:   new Date().toISOString(),
    ended_at:     sessionEnd.toISOString(),
    pairs:        top5.map(s => s.pair),
    total_signals: top5.length,
    status:       'ACTIVE',
  })

  await supabase.from('issue_logs').insert({
    level: 'SUCCESS', source: 'SIGNALS',
    message: `Generated ${top5.length} signals (browser)`,
    details: {
      sessionId: sid,
      pairs:       top5.map(s => s.pair),
      confidences: top5.map(s => s.analysis.confidence),
      directions:  top5.map(s => s.analysis.direction),
      rsiValues:   top5.map(s => s.analysis.rsi),
      skipped,
    }
  })

  log(`✅ Created ${top5.length} signals!`)
  return { success: true, created: top5.length, message: `Created ${top5.length} signals`, skipped }
}

interface ActiveSignal {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  leverage: number;
  session_end: string | null;
}

export async function updateSignalStatusBrowser(): Promise<{
  success: boolean;
  message: string;
  processed: number;
  updated: number;
  tp1Hit: number;
  tp2Hit: number;
  tp3Hit: number;
  slHit: number;
  noTarget: number;
}> {
  const { data: activeSignals } = await supabase
    .from("signals")
    .select("id,pair,direction,entry_price,tp1,tp2,tp3,sl,leverage,session_end")
    .eq("status", "ACTIVE");

  if (!activeSignals?.length) {
    return { success: true, message: "No active signals", processed: 0, updated: 0, tp1Hit: 0, tp2Hit: 0, tp3Hit: 0, slHit: 0, noTarget: 0 };
  }

  let updated = 0, tp1Hit = 0, tp2Hit = 0, tp3Hit = 0, slHit = 0, noTarget = 0;

  for (const signal of activeSignals as ActiveSignal[]) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${signal.pair}`
      );
      const data = await res.json() as { price: string };
      const price = parseFloat(data.price);
      if (!price || isNaN(price)) continue;

      const now = new Date();
      const sessionEnd = signal.session_end ? new Date(signal.session_end) : null;
      const isExpired = sessionEnd && now > sessionEnd;

      let newStatus = "ACTIVE";
      let pnlPct = 0;
      const updateData: Record<string, unknown> = { current_price: price };

      if (signal.direction === "LONG") {
        if (price >= signal.tp3) {
          newStatus = "TP3_HIT"; pnlPct = ((signal.tp3 - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; updateData.hit_tp2 = true; updateData.hit_tp3 = true; tp3Hit++;
        } else if (price >= signal.tp2) {
          newStatus = "TP2_HIT"; pnlPct = ((signal.tp2 - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; updateData.hit_tp2 = true; tp2Hit++;
        } else if (price >= signal.tp1) {
          newStatus = "TP1_HIT"; pnlPct = ((signal.tp1 - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; tp1Hit++;
        } else if (price <= signal.sl) {
          newStatus = "SL_HIT"; pnlPct = ((signal.sl - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_sl = true; slHit++;
        }
      } else {
        if (price <= signal.tp3) {
          newStatus = "TP3_HIT"; pnlPct = ((signal.entry_price - signal.tp3) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; updateData.hit_tp2 = true; updateData.hit_tp3 = true; tp3Hit++;
        } else if (price <= signal.tp2) {
          newStatus = "TP2_HIT"; pnlPct = ((signal.entry_price - signal.tp2) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; updateData.hit_tp2 = true; tp2Hit++;
        } else if (price <= signal.tp1) {
          newStatus = "TP1_HIT"; pnlPct = ((signal.entry_price - signal.tp1) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_tp1 = true; tp1Hit++;
        } else if (price >= signal.sl) {
          newStatus = "SL_HIT"; pnlPct = ((signal.entry_price - signal.sl) / signal.entry_price) * 100 * signal.leverage;
          updateData.hit_sl = true; slHit++;
        }
      }

      if (newStatus === "ACTIVE" && isExpired) {
        newStatus = "NO_TARGET";
        pnlPct = ((price - signal.entry_price) / signal.entry_price) * 100;
        if (signal.direction === "SHORT") pnlPct = -pnlPct;
        noTarget++;
      }

      if (newStatus !== "ACTIVE") {
        updateData.status = newStatus;
        updateData.pnl_pct = parseFloat(pnlPct.toFixed(2));
        updateData.exit_price = price;
        updateData.closed_at = now.toISOString();
        updated++;
      }

      await supabase.from("signals").update(updateData).eq("id", signal.id);
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      console.error("Update error:", signal.pair, err);
    }
  }

  await supabase.from("issue_logs").insert({
    level: "INFO",
    source: "status-updater",
    message: `Status update: ${updated}/${activeSignals.length} signals updated (browser)`,
    details: { processed: activeSignals.length, updated, tp1Hit, tp2Hit, tp3Hit, slHit, noTarget },
  });

  const tpTotal = tp1Hit + tp2Hit + tp3Hit;
  return {
    success: true,
    message: `✅ Updated ${updated} signals — TP: ${tpTotal}, SL: ${slHit}, No Target: ${noTarget}`,
    processed: activeSignals.length,
    updated,
    tp1Hit,
    tp2Hit,
    tp3Hit,
    slHit,
    noTarget,
  };
}
