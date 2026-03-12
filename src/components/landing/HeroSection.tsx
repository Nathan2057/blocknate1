"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const FLOATING_COINS = [
  { symbol: "BTC", color: "#F7931A", top: "20%", left: "5%", size: 52, delay: "0s" },
  { symbol: "ETH", color: "#627EEA", top: "35%", right: "8%", size: 44, delay: "1s" },
  { symbol: "SOL", color: "#9945FF", top: "65%", left: "7%", size: 40, delay: "2s" },
  { symbol: "BNB", color: "#F3BA2F", top: "15%", right: "15%", size: 36, delay: "0.5s" },
  { symbol: "XRP", color: "#00AAE4", bottom: "30%", right: "5%", size: 38, delay: "1.5s" },
  { symbol: "ADA", color: "#0033AD", bottom: "20%", left: "18%", size: 32, delay: "2.5s" },
] as const;

function MockSignalCard() {
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let v = 0;
      const interval = setInterval(() => {
        v += 2;
        setConfidence(v);
        if (v >= 78) clearInterval(interval);
      }, 20);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      background: "#0C1018",
      border: "1px solid #1C2236",
      borderRadius: 8,
      padding: 20,
      maxWidth: 420,
      margin: "0 auto",
      boxShadow: "0 0 60px rgba(0,102,255,0.15), 0 0 120px rgba(0,102,255,0.05)",
      position: "relative",
    }}>
      {/* LIVE badge */}
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5 }}>
        <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C896" }} />
        <span style={{ color: "#00C896", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ background: "#0066FF18", color: "#0066FF", border: "1px solid #0066FF30", borderRadius: 3, padding: "2px 8px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em" }}>🤖 AUTO SIGNAL</span>
        <span style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.9rem" }}>BTCUSDT</span>
        <span style={{ background: "#00C89618", color: "#00C896", border: "1px solid #00C89630", borderRadius: 3, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700 }}>LONG</span>
      </div>

      {/* Price levels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {[
          { label: "TP3", price: "$78,000", color: "#00C896", dim: true },
          { label: "TP2", price: "$75,000", color: "#00C896", dim: true },
          { label: "TP1", price: "$73,000", color: "#00C896", dim: false },
          { label: "ENTRY", price: "$71,000", color: "#0066FF", highlight: true },
          { label: "SL", price: "$68,000", color: "#FF3B5C", dim: false },
        ].map(({ label, price, color, highlight, dim }) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 10px", borderRadius: 3,
            background: highlight ? "rgba(0,102,255,0.08)" : "transparent",
            border: highlight ? "1px solid rgba(0,102,255,0.2)" : "1px solid transparent",
          }}>
            <span style={{ color: "#4A5568", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ color: dim ? `${color}80` : color, fontWeight: 700, fontSize: "0.85rem" }}>{price}</span>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "#4A5568", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Confidence</span>
          <span style={{ color: "#0066FF", fontWeight: 700, fontSize: "0.75rem" }}>{confidence}%</span>
        </div>
        <div style={{ height: 5, background: "#1C2236", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${confidence}%`, background: "linear-gradient(to right, #0066FF, #00C896)", borderRadius: 3, transition: "width 50ms linear" }} />
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: "1px solid #1C2236" }}>
        {["3x Leverage", "4H", "Medium Risk"].map((t) => (
          <span key={t} style={{ color: "#4A5568", fontSize: "0.68rem" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "100px 24px 60px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* LAYER 1 — Top radial glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(0,102,255,0.18) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* LAYER 2 — Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
        background: "linear-gradient(to top, #06080F 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* LAYER 3 — Animated glowing orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "8%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,102,255,0.12) 0%, transparent 70%)",
        animation: "float-orb 8s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "25%", right: "5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%)",
        animation: "float-orb 10s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", left: "25%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,102,255,0.07) 0%, transparent 70%)",
        animation: "float-orb 12s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* LAYER 4 — Grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(28,34,54,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(28,34,54,0.4) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
      }} />

      {/* LAYER 5 — Floating coin icons */}
      {FLOATING_COINS.map((coin) => (
        <div key={coin.symbol} style={{
          position: "absolute",
          top: "top" in coin ? coin.top : undefined,
          bottom: "bottom" in coin ? coin.bottom : undefined,
          left: "left" in coin ? coin.left : undefined,
          right: "right" in coin ? coin.right : undefined,
          width: coin.size, height: coin.size,
          borderRadius: 12,
          background: `rgba(${hexToRgb(coin.color)}, 0.1)`,
          border: `1px solid rgba(${hexToRgb(coin.color)}, 0.25)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "float-coin 6s ease-in-out infinite",
          animationDelay: coin.delay,
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
        }}>
          <span style={{
            color: coin.color,
            fontSize: coin.size * 0.28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}>{coin.symbol}</span>
        </div>
      ))}

      {/* Content */}
      <div style={{ maxWidth: 900, width: "100%", textAlign: "center", position: "relative" }}>
        {/* Badge */}
        <div style={{ animation: "fadeIn 0.5s ease forwards" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.25)",
            borderRadius: 100, padding: "6px 16px", marginBottom: 28,
          }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C896" }} />
            <span style={{ color: "#0066FF", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em" }}>
              LIVE TRADING SIGNALS — POWERED BY AI
            </span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ animation: "fadeIn 0.7s ease 0.1s both" }}>
          <h1 style={{
            fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: "-0.02em", marginBottom: 24,
          }}>
            Trade Smarter With
            <br />
            <span style={{ color: "#0066FF" }}>Professional</span> Crypto
            <br />
            Signals
          </h1>
        </div>

        {/* Subtitle */}
        <div style={{ animation: "fadeIn 0.7s ease 0.2s both" }}>
          <p style={{
            color: "#8892A4", fontSize: "clamp(1rem, 2vw, 1.15rem)",
            maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            Blocknate delivers automated trading signals powered by technical analysis.
            Real-time charts, market tools, and education — everything a serious trader needs.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ animation: "fadeIn 0.7s ease 0.3s both", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <Link href="/auth" className="float-btn" style={{
            background: "#0066FF", color: "#fff",
            padding: "14px 32px", borderRadius: 4,
            fontWeight: 700, fontSize: "0.95rem",
            textDecoration: "none", display: "inline-flex",
            alignItems: "center", gap: 8,
            boxShadow: "0 0 30px rgba(0,102,255,0.4)",
          }}>
            Get Started Free →
          </Link>
          <a href="#features" style={{
            background: "transparent", color: "#E8ECF4",
            padding: "14px 32px", borderRadius: 4,
            fontWeight: 600, fontSize: "0.95rem",
            textDecoration: "none", display: "inline-flex",
            alignItems: "center", gap: 8,
            border: "1px solid #1C2236",
          }}>
            See How It Works ↓
          </a>
        </div>

        {/* Stats */}
        <div style={{ animation: "fadeIn 0.7s ease 0.4s both", display: "flex", justifyContent: "center", gap: 0, marginBottom: 64, flexWrap: "wrap" }}>
          {[
            { value: "5+", label: "Signals Generated" },
            { value: "24/7", label: "Market Monitoring" },
            { value: "100%", label: "Free to Start" },
          ].map(({ value, label }, i) => (
            <div key={label} style={{
              padding: "0 48px",
              borderRight: i < 2 ? "1px solid #1C2236" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>{value}</div>
              <div style={{ color: "#4A5568", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Mock signal card */}
        <div style={{ animation: "fadeIn 0.7s ease 0.5s both" }}>
          <MockSignalCard />
        </div>
      </div>
    </section>
  );
}
