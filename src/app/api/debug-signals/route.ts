import { NextRequest, NextResponse } from "next/server";
import { analyzeSignal } from "@/lib/indicators";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SIGNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
  const results: Record<string, unknown>[] = [];

  for (const pair of testPairs) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=4h&limit=250`;
      const res = await fetch(url, { cache: "no-store" });
      const httpStatus = res.status;
      const data = await res.json();

      const isArray = Array.isArray(data);
      const count = isArray ? data.length : 0;

      let analysis = null;
      let analysisError: string | null = null;

      if (isArray && count > 50) {
        const candles = (data as unknown[][]).map((k) => ({
          timestamp: k[0] as number,
          open: parseFloat(k[1] as string),
          high: parseFloat(k[2] as string),
          low: parseFloat(k[3] as string),
          close: parseFloat(k[4] as string),
          volume: parseFloat(k[5] as string),
        }));

        try {
          analysis = analyzeSignal(candles);
        } catch (e) {
          analysisError = String(e);
        }
      }

      results.push({
        pair,
        httpStatus,
        candleCount: count,
        isArray,
        currentPrice: isArray && count > 0 ? parseFloat((data as unknown[][])[count - 1][4] as string) : null,
        analysis: analysis
          ? {
              direction: analysis.direction,
              confidence: analysis.confidence,
              reasons: analysis.reasons?.slice(0, 3),
              rsi: analysis.rsi,
              atr: analysis.atr,
              tp1: analysis.tp1,
              sl: analysis.sl,
            }
          : null,
        analysisError,
        analysisNull: analysis === null,
      });

      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      results.push({ pair, fatalError: String(err) });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalTested: results.length,
      successfulFetch: results.filter((r) => (r.candleCount as number) > 0).length,
      analysisGenerated: results.filter((r) => r.analysis !== null).length,
      analysisNull: results.filter((r) => r.analysisNull === true).length,
    },
  });
}
