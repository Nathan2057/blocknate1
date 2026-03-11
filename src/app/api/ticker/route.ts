import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 0;

export async function GET() {
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

  const results = await Promise.all(
    symbols.map((symbol) =>
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }).then((r) => r.json())
    )
  );

  const map: Record<string, { usd: number; usd_24h_change: number }> = {};
  for (const item of results as Array<{
    symbol: string;
    lastPrice: string;
    openPrice: string;
    priceChangePercent: string;
  }>) {
    const last = parseFloat(item.lastPrice);
    const open = parseFloat(item.openPrice);
    const change = open > 0 ? ((last - open) / open) * 100 : 0;
    map[item.symbol] = {
      usd: last,
      usd_24h_change: parseFloat(item.priceChangePercent) || parseFloat(change.toFixed(4)),
    };
  }

  return NextResponse.json(
    {
      bitcoin: map["BTCUSDT"],
      ethereum: map["ETHUSDT"],
      binancecoin: map["BNBUSDT"],
      solana: map["SOLUSDT"],
      ripple: map["XRPUSDT"],
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
