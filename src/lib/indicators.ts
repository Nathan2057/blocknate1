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
  prevHistogram: number;
} | null {
  if (closes.length < 35) return null;

  // Build MACD line array for all available windows
  const macdValues: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const e12 = calcEMA(closes.slice(0, i), 12);
    const e26 = calcEMA(closes.slice(0, i), 26);
    if (e12 && e26) macdValues.push(e12 - e26);
  }

  if (macdValues.length < 10) return null;

  const signal = calcEMA(macdValues, 9);
  const prevSignal = calcEMA(macdValues.slice(0, -1), 9);
  if (!signal || !prevSignal) return null;

  const macdLine = macdValues[macdValues.length - 1];
  const prevMacdLine = macdValues[macdValues.length - 2];

  return {
    macd: macdLine,
    signal,
    histogram: macdLine - signal,
    prevHistogram: prevMacdLine - prevSignal,
  };
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

export function calcVolumeRatio(candles: OHLCV[]): number {
  if (candles.length < 20) return 1.0;
  // Last 20 candles; average the first 19 (excluding the current candle)
  const recent = candles.slice(-20);
  const avgVolume = recent.slice(0, -1).reduce((sum, c) => sum + c.volume, 0) / 19;
  const currentVolume = candles[candles.length - 1].volume;
  if (avgVolume === 0) return 1.0;
  return Math.round((currentVolume / avgVolume) * 100) / 100;
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

  const rsi = calcRSI(closes) ?? 50;
  const macd = calcMACD(closes);
  const ema20 = calcEMA(closes, 20);
  const ema50 = calcEMA(closes, 50);
  const ema200 = calcEMA(closes, 200);
  const bb = calcBB(closes);
  const rawAtr = calcATR(candles);
  const safeAtr = rawAtr && rawAtr > 0 ? rawAtr : price * 0.02;
  const volumeRatio = calcVolumeRatio(candles);

  let longScore = 0;
  let shortScore = 0;
  const longReasons: string[] = [];
  const shortReasons: string[] = [];

  // ── RSI scoring — heavy weight, most reliable indicator ──────────────────────
  if (rsi <= 20) {
    longScore += 40; longReasons.push(`RSI extremely oversold (${rsi.toFixed(1)})`);
  } else if (rsi <= 30) {
    longScore += 30; longReasons.push(`RSI oversold (${rsi.toFixed(1)})`);
  } else if (rsi <= 40) {
    longScore += 20; longReasons.push(`RSI approaching oversold (${rsi.toFixed(1)})`);
  } else if (rsi <= 45) {
    longScore += 10; longReasons.push(`RSI below midline (${rsi.toFixed(1)})`);
  } else if (rsi >= 80) {
    shortScore += 40; shortReasons.push(`RSI extremely overbought (${rsi.toFixed(1)})`);
  } else if (rsi >= 70) {
    shortScore += 30; shortReasons.push(`RSI overbought (${rsi.toFixed(1)})`);
  } else if (rsi >= 60) {
    shortScore += 20; shortReasons.push(`RSI approaching overbought (${rsi.toFixed(1)})`);
  } else if (rsi >= 55) {
    shortScore += 10; shortReasons.push(`RSI above midline (${rsi.toFixed(1)})`);
  }
  // 45–55 is neutral, no score

  // ── MACD scoring — detects momentum and crossovers ───────────────────────────
  if (macd) {
    const hist = macd.histogram;
    const prevHist = macd.prevHistogram;
    const crossingUp = prevHist < 0 && hist > 0;
    const crossingDown = prevHist > 0 && hist < 0;

    if (crossingUp) {
      longScore += 30; longReasons.push("MACD bullish crossover");
    } else if (hist > 0 && hist > prevHist) {
      longScore += 20; longReasons.push("MACD momentum increasing");
    } else if (hist > 0) {
      longScore += 10; longReasons.push("MACD positive");
    } else if (crossingDown) {
      shortScore += 30; shortReasons.push("MACD bearish crossover");
    } else if (hist < 0 && hist < prevHist) {
      shortScore += 20; shortReasons.push("MACD momentum decreasing");
    } else if (hist < 0) {
      shortScore += 10; shortReasons.push("MACD negative");
    }
  }

  // ── EMA structure ─────────────────────────────────────────────────────────────
  let emaTrend = "NEUTRAL";

  if (ema20 && ema50) {
    const aboveEma20 = price > ema20;
    const aboveEma50 = price > ema50;
    const ema20AboveEma50 = ema20 > ema50;

    if (aboveEma20 && aboveEma50 && ema20AboveEma50) {
      longScore += 25; longReasons.push("Above EMA20 & EMA50 (strong uptrend)");
      emaTrend = "BULLISH";
    } else if (aboveEma20 && !aboveEma50) {
      longScore += 10; longReasons.push("Above EMA20, testing EMA50");
      emaTrend = "NEUTRAL";
    } else if (!aboveEma20 && !aboveEma50 && !ema20AboveEma50) {
      shortScore += 25; shortReasons.push("Below EMA20 & EMA50 (strong downtrend)");
      emaTrend = "BEARISH";
    } else if (!aboveEma20 && aboveEma50) {
      shortScore += 10; shortReasons.push("Below EMA20, testing EMA50 support");
      emaTrend = "NEUTRAL";
    }
  }

  // ── EMA200 macro bias ─────────────────────────────────────────────────────────
  if (ema200) {
    if (price > ema200) {
      longScore += 15; longReasons.push("Price above EMA200 (bull market)");
    } else {
      shortScore += 15; shortReasons.push("Price below EMA200 (bear market)");
    }
  }

  // ── Bollinger Bands — positional scoring ─────────────────────────────────────
  let bbPosition = "MIDDLE";
  if (bb) {
    const bbRange = bb.upper - bb.lower;
    const bbWidth = bbRange / bb.middle;
    const pricePos = bbRange > 0 ? (price - bb.lower) / bbRange : 0.5;

    if (pricePos <= 0.1) {
      longScore += 25; longReasons.push("Price at BB lower band (oversold)");
      bbPosition = "LOWER";
    } else if (pricePos <= 0.3) {
      longScore += 12; longReasons.push("Price in lower BB zone");
      bbPosition = "LOWER_MID";
    } else if (pricePos >= 0.9) {
      shortScore += 25; shortReasons.push("Price at BB upper band (overbought)");
      bbPosition = "UPPER";
    } else if (pricePos >= 0.7) {
      shortScore += 12; shortReasons.push("Price in upper BB zone");
      bbPosition = "UPPER_MID";
    } else {
      bbPosition = "MIDDLE";
    }

    // BB squeeze = breakout imminent
    if (bbWidth < 0.02) {
      longScore += 5; shortScore += 5;
      longReasons.push("BB squeeze — breakout imminent");
      shortReasons.push("BB squeeze — breakout imminent");
    }
  }

  // ── Volume confirmation ───────────────────────────────────────────────────────
  if (volumeRatio >= 3.0) {
    longScore += 20; shortScore += 20;
    longReasons.push(`Very high volume (${volumeRatio.toFixed(1)}x avg)`);
    shortReasons.push(`Very high volume (${volumeRatio.toFixed(1)}x avg)`);
  } else if (volumeRatio >= 2.0) {
    longScore += 12; shortScore += 12;
    longReasons.push(`High volume (${volumeRatio.toFixed(1)}x avg)`);
    shortReasons.push(`High volume (${volumeRatio.toFixed(1)}x avg)`);
  } else if (volumeRatio >= 1.5) {
    longScore += 6; shortScore += 6;
    longReasons.push(`Above average volume (${volumeRatio.toFixed(1)}x)`);
    shortReasons.push(`Above average volume (${volumeRatio.toFixed(1)}x)`);
  } else if (volumeRatio < 0.5) {
    longScore -= 5; shortScore -= 5;
  }

  // ── Direction + confidence ────────────────────────────────────────────────────
  const direction: "LONG" | "SHORT" = longScore > shortScore ? "LONG" : "SHORT";
  const winScore = direction === "LONG" ? longScore : shortScore;
  const loseScore = direction === "LONG" ? shortScore : longScore;
  const reasons = direction === "LONG" ? longReasons : shortReasons;

  const edge = winScore - loseScore;

  // Max possible score: RSI 40 + MACD 30 + EMA 40 + BB 25 + Volume 20 = 155
  const MAX_SCORE = 155;
  const scoreContrib = Math.min(35, Math.round((winScore / MAX_SCORE) * 35));
  const edgeContrib = Math.min(15, Math.round((edge / 50) * 15));
  const confidence = Math.min(92, Math.max(45, 45 + scoreContrib + edgeContrib));

  // ── TP / SL via ATR ───────────────────────────────────────────────────────────
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

  const leverage = confidence >= 85 ? 5 : confidence >= 75 ? 3 : confidence >= 65 ? 2 : 1;
  const riskLevel = confidence >= 80 ? "LOW" : confidence >= 65 ? "MEDIUM" : "HIGH";

  return {
    direction,
    confidence,
    reasons: reasons.length > 0 ? reasons : [`${direction} bias based on technical analysis`],
    rsi,
    macdHistogram: macd?.histogram ?? null,
    emaTrend,
    atr: safeAtr,
    volumeRatio,
    bbPosition,
    tp1, tp2, tp3, sl,
    leverage,
    riskLevel,
  };
}
