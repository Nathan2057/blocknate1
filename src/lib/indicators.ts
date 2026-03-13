export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function calcEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calcMACD(closes: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} | null {
  if (closes.length < 35) return null;
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12 || !ema26) return null;
  const macdLine = ema12 - ema26;
  const macdValues: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const e12 = calcEMA(closes.slice(0, i), 12);
    const e26 = calcEMA(closes.slice(0, i), 26);
    if (e12 && e26) macdValues.push(e12 - e26);
  }
  const signal = calcEMA(macdValues, 9);
  if (!signal) return null;
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

export function calcBB(
  closes: number[],
  period = 20
): {
  upper: number;
  middle: number;
  lower: number;
  width: number;
  position: string;
} | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(
    slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period
  );
  const upper = middle + 2 * std;
  const lower = middle - 2 * std;
  const price = closes[closes.length - 1];
  const position = price >= upper ? "UPPER" : price <= lower ? "LOWER" : "MIDDLE";
  return { upper, middle, lower, width: ((upper - lower) / middle) * 100, position };
}

export function calcATR(candles: OHLCV[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    trs.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      )
    );
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calcVolumeRatio(candles: OHLCV[], period = 20): number | null {
  if (candles.length < period) return null;
  const avg =
    candles.slice(-period - 1, -1).reduce((a, b) => a + b.volume, 0) / period;
  return avg > 0 ? candles[candles.length - 1].volume / avg : null;
}

export interface SignalAnalysis {
  direction: "LONG" | "SHORT";
  confidence: number;
  reasons: string[];
  rsi: number | null;
  macdHistogram: number | null;
  emaTrend: string;
  atr: number | null;
  volumeRatio: number | null;
  bbPosition: string;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  leverage: number;
  riskLevel: string;
}

export function analyzeSignal(candles: OHLCV[]): SignalAnalysis | null {
  if (!candles || candles.length < 50) return null;

  const closes = candles.map((c) => c.close);
  const price = closes[closes.length - 1];
  if (!price || isNaN(price) || price <= 0) return null;

  // Calculate what we can, falling back to safe defaults
  const rsi = calcRSI(closes) ?? 50;
  const macd = calcMACD(closes);
  const ema20 = calcEMA(closes, 20) ?? price;
  const ema50 = calcEMA(closes, 50) ?? price;
  const ema200 = calcEMA(closes, 200);
  const bb = calcBB(closes);
  const rawAtr = calcATR(candles);
  const safeAtr = rawAtr && rawAtr > 0 ? rawAtr : price * 0.02;
  const volumeRatio = calcVolumeRatio(candles) ?? 1.0;

  let longScore = 0;
  let shortScore = 0;
  const longReasons: string[] = [];
  const shortReasons: string[] = [];

  // RSI scoring (0-30 pts)
  if (rsi < 30) { longScore += 30; longReasons.push(`RSI oversold (${rsi.toFixed(1)})`); }
  else if (rsi < 40) { longScore += 20; longReasons.push(`RSI low (${rsi.toFixed(1)})`); }
  else if (rsi < 50) { longScore += 10; longReasons.push(`RSI below midline (${rsi.toFixed(1)})`); }
  else if (rsi > 70) { shortScore += 30; shortReasons.push(`RSI overbought (${rsi.toFixed(1)})`); }
  else if (rsi > 60) { shortScore += 20; shortReasons.push(`RSI high (${rsi.toFixed(1)})`); }
  else if (rsi > 50) { shortScore += 10; shortReasons.push(`RSI above midline (${rsi.toFixed(1)})`); }

  // MACD scoring (0-25 pts)
  if (macd) {
    if (macd.histogram > 0) {
      const pts = macd.macd > macd.signal ? 25 : 12;
      longScore += pts;
      longReasons.push(macd.macd > macd.signal ? "MACD bullish crossover" : "MACD positive momentum");
    } else {
      const pts = macd.macd < macd.signal ? 25 : 12;
      shortScore += pts;
      shortReasons.push(macd.macd < macd.signal ? "MACD bearish crossover" : "MACD negative momentum");
    }
  }

  // EMA structure (0-20 pts)
  const emaBull = price > ema20 && ema20 > ema50;
  const emaBear = price < ema20 && ema20 < ema50;
  if (emaBull) { longScore += 20; longReasons.push("Above EMA20 & EMA50"); }
  else if (price > ema20) { longScore += 10; longReasons.push("Above EMA20"); }
  if (emaBear) { shortScore += 20; shortReasons.push("Below EMA20 & EMA50"); }
  else if (price < ema20) { shortScore += 10; shortReasons.push("Below EMA20"); }

  // EMA200 bias (0-10 pts)
  if (ema200) {
    if (price > ema200) { longScore += 10; longReasons.push("Above EMA200"); }
    else { shortScore += 10; shortReasons.push("Below EMA200"); }
  }

  // Bollinger Bands (0-15 pts)
  if (bb) {
    if (price <= bb.lower) { longScore += 15; longReasons.push("At BB lower band"); }
    else if (price < bb.middle) { longScore += 7; longReasons.push("Below BB midline"); }
    else if (price >= bb.upper) { shortScore += 15; shortReasons.push("At BB upper band"); }
    else if (price > bb.middle) { shortScore += 7; shortReasons.push("Above BB midline"); }
  }

  // Volume (0-10 pts)
  if (volumeRatio > 1.5) {
    const pts = volumeRatio > 2 ? 10 : 5;
    longScore += pts; shortScore += pts;
    longReasons.push(`High volume (${volumeRatio.toFixed(1)}x)`);
    shortReasons.push(`High volume (${volumeRatio.toFixed(1)}x)`);
  }

  // Always pick stronger direction
  const direction: "LONG" | "SHORT" = longScore >= shortScore ? "LONG" : "SHORT";
  const winScore = direction === "LONG" ? longScore : shortScore;
  const reasons = direction === "LONG" ? longReasons : shortReasons;

  const confidence = Math.min(92, Math.max(45, Math.round(winScore * 0.75)));

  let tp1: number, tp2: number, tp3: number, sl: number;
  if (direction === "LONG") {
    sl  = price - safeAtr * 1.5;
    tp1 = price + safeAtr * 1.0;
    tp2 = price + safeAtr * 2.0;
    tp3 = price + safeAtr * 3.5;
  } else {
    sl  = price + safeAtr * 1.5;
    tp1 = price - safeAtr * 1.0;
    tp2 = price - safeAtr * 2.0;
    tp3 = price - safeAtr * 3.5;
  }

  const emaTrend = emaBull ? "BULLISH" : emaBear ? "BEARISH" : "NEUTRAL";

  return {
    direction,
    confidence,
    reasons: reasons.length > 0 ? reasons : [`${direction} bias based on technical analysis`],
    rsi,
    macdHistogram: macd?.histogram ?? null,
    emaTrend,
    atr: safeAtr,
    volumeRatio,
    bbPosition: bb?.position ?? "MIDDLE",
    tp1, tp2, tp3, sl,
    leverage: confidence >= 80 ? 3 : confidence >= 65 ? 2 : 1,
    riskLevel: confidence >= 75 ? "LOW" : confidence >= 60 ? "MEDIUM" : "HIGH",
  };
}
