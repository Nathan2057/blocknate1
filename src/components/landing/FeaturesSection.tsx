"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";

interface Feature {
  icon: string;
  color: string;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: "⚡", color: "#0066FF", title: "AI-Powered Signals", desc: "Technical indicators including RSI, MACD, EMA, Bollinger Bands and SMC levels automatically analyzed 24/7." },
  { icon: "📊", color: "#00C896", title: "Professional Charts", desc: "TradingView charts with RSI, MACD and Volume for BTC, ETH, SOL, BNB and XRP." },
  { icon: "📡", color: "#F59E0B", title: "Market Intelligence", desc: "Fear & Greed Index, BTC Dominance, Market Heatmap, Altcoin Season Index and Liquidation Analytics." },
  { icon: "📰", color: "#8B5CF6", title: "News & Sentiment", desc: "Real-time crypto news from top sources with AI sentiment analysis — bullish, bearish or neutral." },
  { icon: "📖", color: "#EC4899", title: "Education Hub", desc: "Trading guides, chart patterns, strategies and a complete glossary for all experience levels." },
  { icon: "💼", color: "#14B8A6", title: "Portfolio Tracker", desc: "Track your trades manually and follow platform signals to measure your performance over time." },
];

function FeatureCard({ f, delay }: { f: Feature; delay: number }) {
  const [hovered, setHovered] = useState(false);
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0C1018",
        border: "1px solid #1C2236",
        borderTop: `3px solid ${f.color}`,
        borderRadius: 4,
        padding: 28,
        cursor: "default",
        transform: inView ? (hovered ? "translateY(-4px)" : "translateY(0)") : "translateY(30px)",
        opacity: inView ? 1 : 0,
        boxShadow: hovered ? `0 8px 32px ${f.color}20` : "none",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s, box-shadow 200ms`,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 8, marginBottom: 16,
        background: `${f.color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem",
      }}>
        {f.icon}
      </div>
      <div style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "1rem", marginBottom: 10 }}>{f.title}</div>
      <p style={{ color: "#8892A4", fontSize: "0.82rem", lineHeight: 1.6 }}>{f.desc}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const { ref, inView } = useInView();

  return (
    <section id="features" style={{ padding: "100px 24px", background: "linear-gradient(180deg, #06080F 0%, #080C14 50%, #06080F 100%)" }}>
      {/* Glow lines */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #0066FF, transparent)", opacity: 0.4, animation: "glow-line 3s ease-in-out infinite" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div ref={ref} style={{
          textAlign: "center", marginBottom: 60,
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0066FF" }} />
            <span style={{ color: "#0066FF", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>What You Get</span>
          </div>
          <h2 style={{ color: "#FFFFFF", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Everything You Need To
            <br />
            <span style={{ color: "#0066FF" }}>Trade Professionally</span>
          </h2>
          <p style={{ color: "#8892A4", fontSize: "1rem", marginTop: 16, maxWidth: 520, margin: "16px auto 0" }}>
            All the tools a professional trader needs, in one clean platform.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} delay={i * 0.1} />
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #0066FF, transparent)", opacity: 0.4, animation: "glow-line 3s ease-in-out infinite 1.5s" }} />
    </section>
  );
}
