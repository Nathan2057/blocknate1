"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      height: 64,
      background: "rgba(6,8,15,0.92)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid #1C2236",
      boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
      transition: "box-shadow 300ms",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", height: "100%",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div className="pulse-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00C896", opacity: 0.4 }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#00C896" }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
              <span style={{ color: "#FFFFFF" }}>BLOCK</span>
              <span style={{ color: "#0066FF" }}>NATE</span>
            </span>
          </div>
        </Link>

        {/* Center nav */}
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[
            { label: "Features", href: "#features" },
            { label: "Tools", href: "#tools" },
            { label: "Signals", href: "#signals" },
            { label: "Education", href: "/education" },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              color: "#8892A4", fontSize: "0.88rem", fontWeight: 500,
              textDecoration: "none", position: "relative",
              transition: "color 200ms",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8892A4")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/auth" style={{
            padding: "8px 18px", borderRadius: 4,
            border: "1px solid #1C2236", background: "transparent",
            color: "#8892A4", fontSize: "0.85rem", fontWeight: 500,
            textDecoration: "none", display: "inline-block",
            transition: "border-color 200ms, color 200ms",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0066FF";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1C2236";
              e.currentTarget.style.color = "#8892A4";
            }}
          >
            Sign In
          </Link>
          <Link href="/auth" style={{
            padding: "8px 18px", borderRadius: 4,
            background: "#0066FF", color: "#fff",
            fontSize: "0.85rem", fontWeight: 700,
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 0 20px rgba(0,102,255,0.3)",
          }}>
            Sign Up Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
