"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import FearGreedGauge from "@/components/FearGreedGauge";
import { fgColor } from "@/lib/utils";

interface FGEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface FGResponse {
  data: FGEntry[];
}

const ZONES = [
  { label: "Extreme Fear", range: "0–25", color: "#FF3B5C", desc: "Maximum pessimism. Historically a strong buying opportunity. Market is oversold and panic is at its peak." },
  { label: "Fear", range: "25–45", color: "#FF8C42", desc: "Investors are nervous. Consider accumulating quality assets as sentiment may be overly negative." },
  { label: "Neutral", range: "45–55", color: "#F5C518", desc: "Balanced sentiment. Market is fairly priced based on emotions. Wait for a clearer direction." },
  { label: "Greed", range: "55–75", color: "#AACC00", desc: "Investors getting greedy. Markets may be slightly overextended. Take partial profits on positions." },
  { label: "Extreme Greed", range: "75–100", color: "#00C896", desc: "Euphoria zone. Historically a strong selling signal. Market is overbought — be cautious." },
];

function CustomDot(props: { cx?: number; cy?: number; payload?: { value: number } }) {
  const { cx = 0, cy = 0, payload } = props;
  const color = payload ? fgColor(payload.value) : "#8892A4";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#080C14" strokeWidth={1.5} />;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; value: number; classification: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = fgColor(d.value);
  return (
    <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: "10px 14px", fontSize: "0.78rem" }}>
      <div style={{ color: "#8892A4", marginBottom: 4 }}>{d.date}</div>
      <div style={{ color, fontSize: "1.2rem", fontWeight: 700 }}>{d.value}</div>
      <div style={{ color, fontSize: "0.72rem" }}>{d.classification}</div>
    </div>
  );
}

export default function FearGreedPage() {
  const [entries, setEntries] = useState<FGEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fear-greed")
      .then((r) => r.json())
      .then((j: FGResponse) => setEntries(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = [...entries].reverse().map((e) => ({
    date: format(new Date(parseInt(e.timestamp) * 1000), "MMM d"),
    value: parseInt(e.value),
    classification: e.value_classification,
  }));

  const tableData = entries.map((e, i) => {
    const prev = entries[i + 1];
    const val = parseInt(e.value);
    const prevVal = prev ? parseInt(prev.value) : null;
    const change = prevVal !== null ? val - prevVal : null;
    return {
      date: format(new Date(parseInt(e.timestamp) * 1000), "MMM d, yyyy"),
      value: val,
      classification: e.value_classification,
      change,
    };
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ color: "#E8ECF4", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 24px" }}>
        Fear &amp; Greed Index
      </h1>

      {/* Top row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Left: gauge */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <FearGreedGauge />
        </div>

        {/* Right: historical chart */}
        <div style={{ flex: 1, minWidth: 280, background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, background: "#0066FF", borderRadius: 2 }} />
            <span style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "0.95rem" }}>Historical Data</span>
          </div>

          {loading ? (
            <div style={{ height: 200, background: "#1C2236", borderRadius: 4 }} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <CartesianGrid stroke="#1C2236" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8892A4", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#1C2236" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0066FF"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 5, fill: "#0066FF" }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Table */}
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1C2236" }}>
                      {["Date", "Value", "Classification", "Change"].map((h) => (
                        <th key={h} style={{ padding: "6px 10px", color: "#8892A4", fontWeight: 600, textAlign: "left", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, i) => {
                      const color = fgColor(row.value);
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #1C223640" }}>
                          <td style={{ padding: "7px 10px", color: "#8892A4" }}>{row.date}</td>
                          <td style={{ padding: "7px 10px", color, fontWeight: 700 }}>{row.value}</td>
                          <td style={{ padding: "7px 10px", color }}>{row.classification}</td>
                          <td style={{ padding: "7px 10px", color: row.change === null ? "#8892A4" : row.change >= 0 ? "#00C896" : "#FF3B5C", fontWeight: 600 }}>
                            {row.change === null ? "—" : `${row.change >= 0 ? "+" : ""}${row.change}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Explanation card */}
      <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderLeft: "3px solid #0066FF", borderRadius: 4, padding: 20 }}>
        <h2 style={{ color: "#E8ECF4", fontWeight: 700, fontSize: "1rem", margin: "0 0 16px" }}>
          What is the Fear &amp; Greed Index?
        </h2>
        <p style={{ color: "#8892A4", fontSize: "0.83rem", lineHeight: 1.6, margin: "0 0 20px" }}>
          The Crypto Fear &amp; Greed Index measures market sentiment on a scale of 0–100.
          It aggregates data from volatility, market momentum, social media, surveys, dominance, and trends.
          The core idea: <strong style={{ color: "#E8ECF4" }}>extreme fear is often a buying signal, extreme greed a selling signal</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {ZONES.map((z) => (
            <div key={z.label} style={{ background: "#06080F", borderRadius: 3, padding: 14, borderLeft: `3px solid ${z.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ background: `${z.color}20`, color: z.color, border: `1px solid ${z.color}40`, borderRadius: 3, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700 }}>
                  {z.label}
                </span>
                <span style={{ color: "#4A5568", fontSize: "0.68rem" }}>{z.range}</span>
              </div>
              <p style={{ color: "#8892A4", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>{z.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, background: "#06080F", borderRadius: 3, padding: 14 }}>
          <div style={{ color: "#E8ECF4", fontWeight: 600, fontSize: "0.83rem", marginBottom: 10 }}>💡 Trading Tips</div>
          <ul style={{ color: "#8892A4", fontSize: "0.8rem", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Don&apos;t use it as the sole signal — combine with technical analysis and on-chain data</li>
            <li>Extreme readings (&lt;20 or &gt;80) historically mark local bottoms and tops</li>
            <li>Watch for rapid shifts in the index — they often precede strong moves</li>
            <li>Use <strong style={{ color: "#E8ECF4" }}>dollar-cost averaging</strong> during extreme fear zones</li>
            <li>Scale out of positions as we approach extreme greed territory</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
