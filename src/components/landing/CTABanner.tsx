"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";

export default function CTABanner() {
  const { ref, inView } = useInView();

  return (
    <section style={{ padding: "0 24px 100px" }}>
      <div ref={ref} style={{
        maxWidth: 900, margin: "0 auto", position: "relative",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        {/* Animated border glow */}
        <div style={{
          position: "absolute", inset: -1, borderRadius: 8,
          background: "linear-gradient(135deg, rgba(0,102,255,0.5), rgba(0,200,150,0.3), rgba(0,102,255,0.5))",
          backgroundSize: "200% 200%",
          animation: "gradient-shift 4s ease infinite",
          zIndex: 0,
        }} />
      <div style={{
        position: "relative", zIndex: 1,
        background: "linear-gradient(135deg, rgba(0,102,255,0.08) 0%, rgba(0,200,150,0.05) 100%)",
        borderRadius: 8,
        padding: "80px 40px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: 12, height: 12 }}>
            <div className="pulse-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#0066FF", opacity: 0.4 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#0066FF" }} />
          </div>
        </div>
        <h2 style={{ color: "#FFFFFF", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Start Trading Smarter Today
        </h2>
        <p style={{ color: "#8892A4", fontSize: "1rem", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Join thousands of traders using Blocknate for professional crypto analysis.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <Link href="/auth" style={{
            background: "#0066FF", color: "#fff",
            padding: "13px 28px", borderRadius: 4,
            fontWeight: 700, fontSize: "0.92rem",
            textDecoration: "none",
            boxShadow: "0 0 24px rgba(0,102,255,0.35)",
          }}>
            Sign Up Free
          </Link>
          <Link href="/dashboard" style={{
            background: "transparent", color: "#E8ECF4",
            padding: "13px 28px", borderRadius: 4,
            fontWeight: 600, fontSize: "0.92rem",
            textDecoration: "none",
            border: "1px solid #1C2236",
          }}>
            Explore Dashboard
          </Link>
        </div>
        <p style={{ color: "#4A5568", fontSize: "0.72rem" }}>No credit card required · Always free</p>
      </div>
      </div>
    </section>
  );
}
