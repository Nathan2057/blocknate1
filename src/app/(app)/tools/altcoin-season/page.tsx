"use client";

import { useEffect, useState } from "react";

interface Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: number;
  market_cap: number;
  image?: string;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startPct: number, endPct: number) {
  const startAngle = startPct * 180;
  const endAngle = endPct * 180;
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function getAltcoinLabel(index: number): { label: string; color: string } {
  if (index >= 75) return { label: "Altcoin Season", color: "#00C896" };
  if (index >= 25) return { label: "Neutral", color: "#F5C518" };
  return { label: "Bitcoin Season", color: "#FF8C42" };
}

const STABLECOINS = ["usdt", "usdc", "busd", "dai", "tusd", "usdp", "gusd", "frax"];

export default function AltcoinSeasonPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [altcoinIndex, setAltcoinIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((d: Coin[] | { error: string }) => {
        const list: Coin[] = Array.isArray(d) ? d : [];
        setCoins(list);

        function pct24h(c: Coin) {
          return c.price_change_percentage_24h ?? c.price_change_percentage_24h_in_currency ?? 0;
        }

        // Calculate altcoin season index from 24h change
        const btc = list.find((c) => c.id === "bitcoin" || c.symbol === "btc");
        const btcChange = btc ? pct24h(btc) : 0;

        const alts = list.filter(
          (c) =>
            c.id !== "bitcoin" &&
            c.symbol !== "btc" &&
            !STABLECOINS.includes(c.symbol?.toLowerCase() ?? "")
        );

        if (alts.length > 0) {
          const outperforming = alts.filter((c) => pct24h(c) > btcChange);
          const idx = Math.round((outperforming.length / alts.length) * 100);
          setAltcoinIndex(idx);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const index = altcoinIndex ?? 50;
  const { label, color } = getAltcoinLabel(index);
  const pct = index / 100;
  const cx = 100, cy = 100, r = 80;
  const needleAngle = pct * 180;
  const needle = polarToXY(cx, cy, r - 6, needleAngle);

  const ZONES = [
    { label: "Bitcoin Season", color: "#FF8C42", start: 0, end: 0.25 },
    { label: "Mostly BTC", color: "#F5C518", start: 0.25, end: 0.5 },
    { label: "Mixed", color: "#AACC00", start: 0.5, end: 0.75 },
    { label: "Altcoin Season", color: "#00C896", start: 0.75, end: 1 },
  ];

  function pct24h(c: Coin) {
    return c.price_change_percentage_24h ?? c.price_change_percentage_24h_in_currency ?? 0;
  }

  // Top/bottom performers (excluding BTC and stables)
  const alts = coins.filter(
    (c) => c.id !== "bitcoin" && c.symbol !== "btc" && !STABLECOINS.includes(c.symbol?.toLowerCase() ?? "")
  );
  const sorted = [...alts].sort((a, b) => pct24h(b) - pct24h(a));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ color: "#E8ECF4", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 24px" }}>
        Altcoin Season Index
      </h1>

      {/* Top row: gauge + explanation cards */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>

        {/* Gauge */}
        <div style={{ width: 340, flexShrink: 0, background: "#0C1018", border: "1px solid #1C2236", borderLeft: `3px solid ${color}`, borderRadius: 4, padding: 20 }}>
          <div style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>
            Current Index
          </div>
          {loading ? (
            <div style={{ height: 200, background: "#1C2236", borderRadius: 4 }} />
          ) : (
            <>
              <svg viewBox="0 0 200 110" style={{ width: "100%", maxWidth: 240, display: "block", margin: "0 auto" }}>
                <path d={describeArc(cx, cy, r, 0, 1)} fill="none" stroke="#1C2236" strokeWidth={14} strokeLinecap="butt" />
                {ZONES.map((z) => (
                  <path key={z.label} d={describeArc(cx, cy, r, z.start, z.end)} fill="none" stroke={z.color} strokeWidth={14} strokeLinecap="butt" opacity={0.25} />
                ))}
                <path d={describeArc(cx, cy, r, 0, pct)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="butt" opacity={0.9} />
                <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="white" strokeWidth={2} strokeLinecap="round" opacity={0.9} />
                <circle cx={cx} cy={cy} r={5} fill={color} />
              </svg>

              <div style={{ textAlign: "center", marginTop: 4 }}>
                <div style={{ fontSize: "4.5rem", fontWeight: 900, color, lineHeight: 1 }}>{index}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
                  {label}
                </div>
                <div style={{ color: "#8892A4", fontSize: "0.72rem", marginTop: 8 }}>
                  Based on 24h performance vs BTC
                </div>
              </div>

              {/* Zone legend */}
              <div style={{ borderTop: "1px solid #1C2236", marginTop: 16, paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                {ZONES.map((z) => (
                  <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.68rem", color: "#8892A4", flex: 1 }}>{z.label}</span>
                    <span style={{ fontSize: "0.65rem", color: "#4A5568" }}>
                      {z.label === "Bitcoin Season" ? "0–25" : z.label === "Mostly BTC" ? "25–50" : z.label === "Mixed" ? "50–75" : "75–100"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Explanation cards */}
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { title: "What is Altcoin Season?", color: "#00C896", desc: "Altcoin season occurs when the majority of top 50 altcoins outperform Bitcoin over a set period. It typically follows a Bitcoin rally when traders rotate profits from BTC into higher-beta altcoins seeking larger percentage gains." },
            { title: "How to Trade It", color: "#0066FF", desc: "During altcoin season: focus on altcoins with strong fundamentals and catalysts. During Bitcoin season: reduce altcoin exposure and hold more BTC or stablecoins. Never chase pumped coins — look for early movers." },
            { title: "Historical Context", color: "#F59E0B", desc: "Major altcoin seasons occurred in late 2017, early 2021, and late 2021. They tend to last 1–3 months. The index resets when BTC starts a new accumulation phase after a major altcoin peak." },
          ].map(({ title, color: c, desc }) => (
            <div key={title} style={{ background: "#0C1018", border: "1px solid #1C2236", borderLeft: `3px solid ${c}`, borderRadius: 4, padding: 16 }}>
              <div style={{ color: c, fontWeight: 700, fontSize: "0.88rem", marginBottom: 8 }}>{title}</div>
              <p style={{ color: "#8892A4", fontSize: "0.8rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top/Bottom performers */}
      {!loading && alts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Top performers */}
          <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ background: "#080C14", borderBottom: "1px solid #1C2236", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#00C896", fontSize: "1rem" }}>🏆</span>
              <span style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.88rem" }}>Top Performers (24h)</span>
            </div>
            {top5.map((coin, i) => (
              <div key={coin.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < 4 ? "1px solid #1C223640" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#4A5568", fontSize: "0.72rem", width: 16 }}>{i + 1}</span>
                  <div>
                    <div style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.85rem" }}>{coin.symbol?.toUpperCase()}</div>
                    <div style={{ color: "#8892A4", fontSize: "0.68rem" }}>{coin.name}</div>
                  </div>
                </div>
                <span style={{ color: "#00C896", fontWeight: 700, fontSize: "0.88rem" }}>
                  +{(pct24h(coin) ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Bottom performers */}
          <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ background: "#080C14", borderBottom: "1px solid #1C2236", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "1rem" }}>📉</span>
              <span style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.88rem" }}>Weakest Performers (24h)</span>
            </div>
            {bottom5.map((coin, i) => (
              <div key={coin.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < 4 ? "1px solid #1C223640" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#4A5568", fontSize: "0.72rem", width: 16 }}>{i + 1}</span>
                  <div>
                    <div style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.85rem" }}>{coin.symbol?.toUpperCase()}</div>
                    <div style={{ color: "#8892A4", fontSize: "0.68rem" }}>{coin.name}</div>
                  </div>
                </div>
                <span style={{ color: "#FF3B5C", fontWeight: 700, fontSize: "0.88rem" }}>
                  {(pct24h(coin) ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
