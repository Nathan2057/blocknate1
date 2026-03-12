"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";

const CARDS = [
  { symbol: "BTCUSDT", type: "LONG", confidence: 78, entry: "$71,000", color: "#00C896", rotate: 0, translateY: 0, zIndex: 3 },
  { symbol: "ETHUSDT", type: "LONG", confidence: 72, entry: "$3,850", color: "#00C896", rotate: -3, translateY: 8, zIndex: 2 },
  { symbol: "SOLUSDT", type: "SHORT", confidence: 65, entry: "$185", color: "#FF3B5C", rotate: -6, translateY: 16, zIndex: 1 },
];

export default function SignalPreview() {
  const { ref: leftRef, inView: leftIn } = useInView();
  const { ref: rightRef, inView: rightIn } = useInView();

  return (
    <section id="signals" style={{
      padding: "100px 24px",
      background: "#080C14",
      borderTop: "1px solid #1C2236",
      borderBottom: "1px solid #1C2236",
      borderLeft: "3px solid #0066FF",
      boxShadow: "inset 4px 0 20px rgba(0,102,255,0.1)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        {/* Left */}
        <div ref={leftRef} style={{
          opacity: leftIn ? 1 : 0,
          transform: leftIn ? "translateX(0)" : "translateX(-40px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C896" }} />
            <span style={{ color: "#00C896", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live Signals</span>
          </div>
          <h2 style={{ color: "#FFFFFF", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 20 }}>
            Real Signals.<br />Real Results.
          </h2>
          <p style={{ color: "#8892A4", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: 28 }}>
            Every signal is backed by multi-indicator technical analysis — RSI, MACD, EMA confluence, Bollinger Bands and Smart Money Concepts — all firing together for maximum confidence.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
            {[
              "Entry zone with low and high range",
              "Three take profit targets (TP1, TP2, TP3)",
              "Stop loss to protect your capital",
              "Confidence score and analysis summary",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,200,150,0.12)", border: "1px solid #00C89640", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#00C896", fontSize: "0.65rem" }}>✓</span>
                </div>
                <span style={{ color: "#8892A4", fontSize: "0.88rem" }}>{item}</span>
              </div>
            ))}
          </div>
          <Link href="/auth" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#0066FF", color: "#fff",
            padding: "12px 24px", borderRadius: 4,
            fontWeight: 700, fontSize: "0.9rem",
            textDecoration: "none",
            boxShadow: "0 0 20px rgba(0,102,255,0.3)",
          }}>
            View Live Signals →
          </Link>
        </div>

        {/* Right: stacked cards */}
        <div ref={rightRef} style={{
          position: "relative", height: 280,
          opacity: rightIn ? 1 : 0,
          transform: rightIn ? "translateX(0)" : "translateX(40px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          {/* Glow behind cards */}
          <div style={{
            position: "absolute", inset: -20,
            background: "radial-gradient(circle, rgba(0,102,255,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          {[...CARDS].reverse().map((card, i) => (
            <div key={card.symbol} style={{
              position: "absolute", left: "50%",
              transform: `translateX(-50%) rotate(${card.rotate}deg) translateY(${card.translateY}px)`,
              zIndex: card.zIndex,
              width: 320,
              background: "#0C1018",
              border: "1px solid #1C2236",
              borderTop: `2px solid ${card.color}`,
              borderRadius: 6,
              padding: "14px 16px",
              animation: `float-up ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.88rem" }}>{card.symbol}</span>
                <span style={{
                  background: `${card.color}18`, color: card.color,
                  border: `1px solid ${card.color}30`,
                  borderRadius: 3, padding: "1px 7px", fontSize: "0.65rem", fontWeight: 700,
                }}>
                  {card.type}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#4A5568", fontSize: "0.72rem" }}>Entry</span>
                <span style={{ color: "#E8ECF4", fontWeight: 600, fontSize: "0.82rem" }}>{card.entry}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#4A5568", fontSize: "0.65rem" }}>Confidence</span>
                  <span style={{ color: "#0066FF", fontWeight: 700, fontSize: "0.72rem" }}>{card.confidence}%</span>
                </div>
                <div style={{ height: 4, background: "#1C2236", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${card.confidence}%`, background: "linear-gradient(to right, #0066FF, #00C896)", borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
