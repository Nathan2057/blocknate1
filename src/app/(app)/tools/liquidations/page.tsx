"use client";

import { useEffect, useRef, useState } from "react";

function FallbackChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0C1018",
      gridColor: "#1C2236",
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      studies: ["STD;Volume"],
      support_host: "https://www.tradingview.com",
    });

    wrapper.appendChild(widgetDiv);
    wrapper.appendChild(script);
    chartRef.current.appendChild(wrapper);

    return () => {
      if (chartRef.current) chartRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div style={{ height: "100%" }}>
      <div style={{ padding: "10px 14px", background: "#080C14", borderBottom: "1px solid #1C2236", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#F59E0B", fontSize: "0.75rem" }}>⚠️ Coinglass blocked — showing price chart as fallback</span>
      </div>
      <div ref={chartRef} style={{ height: "calc(100% - 37px)" }} />
    </div>
  );
}

export default function LiquidationsPage() {
  const [iframeBlocked, setIframeBlocked] = useState(false);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: "#E8ECF4", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px" }}>
          Liquidation Heatmap
        </h1>
        <p style={{ color: "#8892A4", fontSize: "0.83rem", margin: 0, lineHeight: 1.5 }}>
          Visualize where leveraged positions will be liquidated at key price levels.
          High liquidation clusters act as price magnets.
        </p>
      </div>

      {/* Main embed */}
      <div
        style={{
          background: "#0C1018",
          border: "1px solid #1C2236",
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 20,
          height: 620,
        }}
      >
        {iframeBlocked ? (
          <FallbackChart />
        ) : (
          <iframe
            src="https://www.coinglass.com/LiquidationData"
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Coinglass Liquidation Heatmap"
            onError={() => setIframeBlocked(true)}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </div>

      {/* External link */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <a
          href="https://www.coinglass.com/LiquidationData"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#0066FF", color: "#fff", borderRadius: 3, padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          🔗 Open Coinglass Full View
        </a>
        <a
          href="https://www.coinglass.com/bitcoin-liquidation-heatmap"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#0C1018", color: "#8892A4", border: "1px solid #1C2236", borderRadius: 3, padding: "8px 16px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          🔥 BTC Liquidation Heatmap
        </a>
      </div>

      {/* Explanation */}
      <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderLeft: "3px solid #FF3B5C", borderRadius: 4, padding: 20 }}>
        <h2 style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "1rem", margin: "0 0 16px" }}>
          Understanding Liquidations
        </h2>
        <p style={{ color: "#8892A4", fontSize: "0.83rem", lineHeight: 1.7, margin: "0 0 16px" }}>
          A liquidation occurs when an exchange forcibly closes a leveraged trader&apos;s position because they
          no longer have enough margin to keep it open. When price reaches a liquidation cluster,
          it triggers a cascade of forced selling (or buying), amplifying the move.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {[
            { title: "Long Liquidations", color: "#FF3B5C", icon: "📉", desc: "When price drops, leveraged long positions get liquidated. Large long liquidation clusters below current price act as strong support zones — but if broken, price accelerates downward." },
            { title: "Short Liquidations", color: "#00C896", icon: "📈", desc: "When price rises, leveraged short positions get liquidated. Large short liquidation clusters above price act as resistance — but if breached, price spikes upward rapidly." },
            { title: "Liquidation Cascades", color: "#F59E0B", icon: "⚡", desc: "When price hits a cluster, it forces liquidations which further move price into more clusters, causing a cascade. These create the large 'wicks' seen on candle charts." },
            { title: "Trading with Liquidations", color: "#0066FF", icon: "🎯", desc: "Professional traders use liquidation maps to identify likely price targets. If a large cluster exists above, price may be 'hunted' to that level before reversing." },
          ].map(({ title, color, icon, desc }) => (
            <div key={title} style={{ background: "#06080F", borderRadius: 3, padding: 14, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span>{icon}</span>
                <span style={{ color, fontWeight: 700, fontSize: "0.83rem" }}>{title}</span>
              </div>
              <p style={{ color: "#8892A4", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
