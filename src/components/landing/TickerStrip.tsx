"use client";

import { useEffect, useState } from "react";

interface TickerCoin {
  symbol: string;
  price: number;
  change: number;
}

const FALLBACK: TickerCoin[] = [
  { symbol: "BTC", price: 71000, change: 2.4 },
  { symbol: "ETH", price: 3800, change: 1.8 },
  { symbol: "SOL", price: 185, change: 3.1 },
  { symbol: "BNB", price: 580, change: 0.9 },
  { symbol: "XRP", price: 0.62, change: -1.2 },
];

function formatPrice(p: number | null | undefined) {
  if (p === null || p === undefined || isNaN(p)) return "0.00";
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

export default function TickerStrip() {
  const [coins, setCoins] = useState<TickerCoin[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/ticker")
      .then((r) => r.json())
      .then((d: Record<string, { price: number; change: number }>) => {
        const MAP: Record<string, string> = {
          bitcoin: "BTC", ethereum: "ETH", binancecoin: "BNB", solana: "SOL", ripple: "XRP",
        };
        const list = Object.entries(d).map(([id, v]) => ({
          symbol: MAP[id] ?? id.toUpperCase(),
          price: v.price,
          change: v.change,
        }));
        if (list.length > 0) setCoins(list);
      })
      .catch(() => {});
  }, []);

  const items = [...coins, ...coins];

  return (
    <div style={{
      background: "#080C14",
      borderTop: "1px solid #1C2236",
      borderBottom: "1px solid #1C2236",
      height: 48,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Fade masks */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, #080C14, transparent)", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, #080C14, transparent)", zIndex: 1, pointerEvents: "none" }} />

      <div className="ticker-animate" style={{ height: "100%", alignItems: "center" }}>
        {items.map((coin, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 28px", borderRight: "1px solid #1C223640", height: "100%" }}>
            <span style={{ color: "#4A5568", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em" }}>{coin.symbol}</span>
            <span style={{ color: "#E8ECF4", fontSize: "0.8rem", fontWeight: 600 }}>${formatPrice(coin.price)}</span>
            <span style={{ color: (coin.change ?? 0) >= 0 ? "#00C896" : "#FF3B5C", fontSize: "0.72rem", fontWeight: 600 }}>
              {(coin.change ?? 0) >= 0 ? "+" : ""}{(coin.change ?? 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
