import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_INTERVALS = new Set(["1m","3m","5m","15m","30m","1h","2h","4h","6h","8h","12h","1d","3d","1w","1M"]);

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const intervalParam = req.nextUrl.searchParams.get("interval") || "4h";
  const limitParam = req.nextUrl.searchParams.get("limit") || "250";

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  // Validate symbol: only uppercase alphanumeric, 2-20 chars
  if (!/^[A-Z0-9]{2,20}$/.test(symbol)) {
    return NextResponse.json({ error: "invalid symbol" }, { status: 400 });
  }

  // Validate interval against allowed list
  const interval = ALLOWED_INTERVALS.has(intervalParam) ? intervalParam : "4h";

  // Validate limit: numeric, 1–1000
  const limitNum = parseInt(limitParam, 10);
  const limit = String(isNaN(limitNum) || limitNum < 1 || limitNum > 1000 ? 250 : limitNum);

  const endpoints = [
    `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    `https://api1.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    `https://api2.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    `https://api3.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-store",
          "X-Source": new URL(url).hostname,
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "All Binance endpoints failed" }, { status: 503 });
}
