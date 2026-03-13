import { analyzeSignal, OHLCV } from "./indicators";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAIR_POOL = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
  "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT",
  "UNIUSDT", "ATOMUSDT", "LTCUSDT", "NEARUSDT", "APTUSDT",
  "ARBUSDT", "OPUSDT", "INJUSDT", "SEIUSDT", "SUIUSDT",
  "TIAUSDT", "STXUSDT", "FETUSDT", "AAVEUSDT", "MKRUSDT",
];

async function fetchCandlesBrowser(
  symbol: string,
  interval = "4h",
  limit = 250
): Promise<OHLCV[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as unknown[][]).map((k) => ({
      timestamp: Number(k[0]),
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
    }));
  } catch {
    return [];
  }
}

function generateSessionId(): string {
  const now = new Date();
  const slot = Math.floor(now.getUTCHours() / 4);
  return `${now.toISOString().split("T")[0]}_slot${slot}`;
}

export async function generateSignalsBrowser(
  force = false,
  onProgress?: (msg: string) => void
): Promise<{
  success: boolean;
  created: number;
  sessionId: string;
  message: string;
  skipped: string[];
}> {
  const log = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  const sessionId = force
    ? `${generateSessionId()}_forced_${Date.now()}`
    : generateSessionId();

  const todayStr = new Date().toISOString().split("T")[0];

  if (!force) {
    const { data: existingSession } = await supabase
      .from("signal_sessions")
      .select("id, status")
      .eq("session_id", sessionId)
      .single();

    if (existingSession?.status === "ACTIVE") {
      return {
        success: false,
        created: 0,
        sessionId,
        message: `Session ${sessionId} already active`,
        skipped: [],
      };
    }
  }

  const { data: todaySignals } = await supabase
    .from("signals")
    .select("pair")
    .gte("created_at", `${todayStr}T00:00:00Z`);

  const usedToday = new Set(
    ((todaySignals ?? []) as { pair: string }[]).map((s) => s.pair)
  );
  log(`Used today: ${usedToday.size} pairs`);

  const available = PAIR_POOL.filter((p) => !usedToday.has(p));
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  log(`Analyzing ${Math.min(15, shuffled.length)} pairs...`);

  type Scored = { pair: string; analysis: NonNullable<ReturnType<typeof analyzeSignal>>; price: number };
  const scored: Scored[] = [];
  const skipped: string[] = [];

  for (const pair of shuffled.slice(0, 15)) {
    log(`Fetching ${pair}...`);
    const candles = await fetchCandlesBrowser(pair, "4h", 250);

    if (candles.length < 50) {
      skipped.push(`${pair}: ${candles.length} candles`);
      log(`${pair}: insufficient data (${candles.length} candles)`);
      continue;
    }

    const analysis = analyzeSignal(candles);
    const price = candles[candles.length - 1].close;

    if (!analysis) {
      skipped.push(`${pair}: no analysis`);
      continue;
    }

    log(`${pair}: ${analysis.direction} ${analysis.confidence}%`);
    scored.push({ pair, analysis, price });

    await new Promise((r) => setTimeout(r, 100));
  }

  scored.sort((a, b) => b.analysis.confidence - a.analysis.confidence);
  const top5 = scored.slice(0, 5);

  if (top5.length === 0) {
    return { success: false, created: 0, sessionId, message: "No valid signals found", skipped };
  }

  log(`Creating ${top5.length} signals...`);

  const sessionEnd = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const signals = top5.map(({ pair, analysis, price }) => ({
    pair,
    symbol: pair.replace("USDT", ""),
    direction: analysis.direction,
    timeframe: "4H",
    entry_price: price,
    current_price: price,
    tp1: parseFloat(analysis.tp1.toFixed(8)),
    tp2: parseFloat(analysis.tp2.toFixed(8)),
    tp3: parseFloat(analysis.tp3.toFixed(8)),
    sl: parseFloat(analysis.sl.toFixed(8)),
    confidence: analysis.confidence,
    leverage: analysis.leverage,
    risk_level: analysis.riskLevel,
    rsi: analysis.rsi ? parseFloat(analysis.rsi.toFixed(2)) : null,
    macd_histogram: analysis.macdHistogram ? parseFloat(analysis.macdHistogram.toFixed(6)) : null,
    ema_trend: analysis.emaTrend,
    atr: analysis.atr ? parseFloat(analysis.atr.toFixed(8)) : null,
    volume_ratio: analysis.volumeRatio ? parseFloat(analysis.volumeRatio.toFixed(2)) : null,
    bb_position: analysis.bbPosition,
    analysis: `${analysis.direction} on ${pair} with ${analysis.confidence}% confidence. ${analysis.reasons.slice(0, 3).join(". ")}.`,
    reasons: analysis.reasons,
    session_id: sessionId,
    session_start: new Date().toISOString(),
    session_end: sessionEnd.toISOString(),
    status: "ACTIVE",
    hit_tp1: false,
    hit_tp2: false,
    hit_tp3: false,
    hit_sl: false,
  }));

  const { error } = await supabase.from("signals").insert(signals);

  if (error) {
    return { success: false, created: 0, sessionId, message: `DB error: ${error.message}`, skipped };
  }

  await supabase.from("signal_sessions").upsert({
    session_id: sessionId,
    started_at: new Date().toISOString(),
    ended_at: sessionEnd.toISOString(),
    pairs: top5.map((s) => s.pair),
    total_signals: top5.length,
    status: "ACTIVE",
  });

  await supabase.from("issue_logs").insert({
    level: "INFO",
    source: "signal-generator",
    message: `Generated ${top5.length} signals (browser)`,
    details: {
      sessionId,
      pairs: top5.map((s) => s.pair),
      confidences: top5.map((s) => s.analysis.confidence),
      skipped,
    },
  });

  log(`✅ Created ${top5.length} signals!`);

  return { success: true, created: top5.length, sessionId, message: `Created ${top5.length} signals`, skipped };
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
