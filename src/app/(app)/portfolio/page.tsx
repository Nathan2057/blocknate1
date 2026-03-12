"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */
interface Trade {
  id: string;
  user_id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  leverage: number;
  status: "OPEN" | "CLOSED";
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  created_at: string;
}

/* ─── Helpers ─── */
function fmtPrice(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "$0.00";
  return n >= 1000
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${n.toFixed(2)}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calcPnl(direction: "LONG" | "SHORT", entry: number, exit: number, qty: number, lev: number) {
  const raw = direction === "LONG" ? (exit - entry) * qty * lev : (entry - exit) * qty * lev;
  const pct = (raw / (entry * qty)) * 100;
  return { pnl: raw, pnl_pct: pct };
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/* ─── Sub-components ─── */
function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderLeft: `3px solid ${color}`, borderRadius: 4, padding: "16px 20px", flex: 1, minWidth: 0 }}>
      <div style={{ color: "#4A5568", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#FFFFFF", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: "#4A5568", fontSize: "0.72rem", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}30`, borderRadius: 3, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{text}</span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(6,8,15,0.8)",
  border: "1px solid #1C2236",
  borderRadius: 3,
  padding: "9px 12px",
  color: "#E8ECF4",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#8892A4",
  fontSize: "0.68rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 5,
};

/* ─── Add Trade Modal ─── */
function AddTradeModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [pair, setPair] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [leverage, setLeverage] = useState("1");
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [exitPrice, setExitPrice] = useState("");
  const [closedAt, setClosedAt] = useState(nowLocal());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const entry = parseFloat(entryPrice);
  const exit = parseFloat(exitPrice);
  const qty = parseFloat(quantity);
  const lev = parseFloat(leverage);
  const hasPreview = status === "CLOSED" && !isNaN(entry) && !isNaN(exit) && !isNaN(qty) && !isNaN(lev) && entry > 0 && exit > 0 && qty > 0;
  const preview = hasPreview ? calcPnl(direction, entry, exit, qty, lev) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pair.trim()) { setError("Pair is required"); return; }
    if (!entryPrice || isNaN(entry) || entry <= 0) { setError("Valid entry price required"); return; }
    if (!quantity || isNaN(qty) || qty <= 0) { setError("Valid quantity required"); return; }
    setLoading(true);
    const computed = status === "CLOSED" && !isNaN(exit) && exit > 0
      ? calcPnl(direction, entry, exit, qty, lev)
      : { pnl: null, pnl_pct: null };
    const { error: dbError } = await supabase!.from("portfolio_trades").insert({
      user_id: userId,
      pair: pair.toUpperCase().trim(),
      direction,
      entry_price: entry,
      exit_price: status === "CLOSED" && !isNaN(exit) ? exit : null,
      quantity: qty,
      leverage: lev,
      status,
      closed_at: status === "CLOSED" ? new Date(closedAt).toISOString() : null,
      notes: notes.trim() || null,
      pnl: computed.pnl,
      pnl_pct: computed.pnl_pct,
    });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 6, padding: 32, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem", margin: 0 }}>Add New Trade</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4A5568", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.3)", borderRadius: 3, padding: "9px 12px", color: "#FF3B5C", fontSize: "0.8rem", marginBottom: 16 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Pair + Direction */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Pair</label>
              <input type="text" value={pair} onChange={(e) => setPair(e.target.value)} placeholder="BTCUSDT" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as "LONG" | "SHORT")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="LONG" style={{ color: "#00C896" }}>LONG</option>
                <option value="SHORT" style={{ color: "#FF3B5C" }}>SHORT</option>
              </select>
            </div>
          </div>

          {/* Row 2: Entry Price + Quantity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Entry Price</label>
              <input type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="71000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0.01" style={inputStyle} />
            </div>
          </div>

          {/* Row 3: Leverage + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Leverage</label>
              <select value={leverage} onChange={(e) => setLeverage(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {["1", "2", "3", "5", "10", "20", "25"].map((v) => (
                  <option key={v} value={v}>{v}x</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "OPEN" | "CLOSED")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          {/* Row 4 (closed only): Exit Price + Closed At */}
          {status === "CLOSED" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Exit Price</label>
                <input type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="75000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Closed At</label>
                <input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          {/* PnL preview */}
          {preview && (
            <div style={{ background: preview.pnl >= 0 ? "rgba(0,200,150,0.06)" : "rgba(255,59,92,0.06)", border: `1px solid ${preview.pnl >= 0 ? "rgba(0,200,150,0.25)" : "rgba(255,59,92,0.25)"}`, borderRadius: 3, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ color: "#4A5568", fontSize: "0.75rem" }}>Estimated PnL: </span>
              <span style={{ color: preview.pnl >= 0 ? "#00C896" : "#FF3B5C", fontWeight: 700, fontSize: "0.88rem" }}>
                {preview.pnl >= 0 ? "+" : ""}{fmtPrice(preview.pnl)} ({preview.pnl_pct >= 0 ? "+" : ""}{preview.pnl_pct.toFixed(2)}%)
              </span>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Trade notes, reasoning..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", background: "#0066FF", color: "#fff", border: "none", borderRadius: 3, padding: "11px 0", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "default" : "pointer", opacity: loading ? 0.8 : 1 }}>
            {loading ? "Adding..." : "Add Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Close Trade Modal ─── */
function CloseTradeModal({ trade, onClose, onSaved }: { trade: Trade; onClose: () => void; onSaved: () => void }) {
  const [exitPrice, setExitPrice] = useState("");
  const [closedAt, setClosedAt] = useState(nowLocal());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exit = parseFloat(exitPrice);
  const hasPreview = !isNaN(exit) && exit > 0;
  const preview = hasPreview ? calcPnl(trade.direction, trade.entry_price, exit, trade.quantity, trade.leverage) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exitPrice || isNaN(exit) || exit <= 0) { setError("Valid exit price required"); return; }
    setLoading(true);
    const { pnl, pnl_pct } = calcPnl(trade.direction, trade.entry_price, exit, trade.quantity, trade.leverage);
    const { error: dbError } = await supabase!.from("portfolio_trades").update({
      status: "CLOSED",
      exit_price: exit,
      closed_at: new Date(closedAt).toISOString(),
      pnl,
      pnl_pct,
    }).eq("id", trade.id);
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 6, padding: 32, width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem", margin: 0 }}>Close Trade — {trade.pair}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4A5568", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}>×</button>
        </div>

        {/* Trade summary */}
        <div style={{ background: "#080C14", border: "1px solid #1C2236", borderRadius: 3, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <Badge text={trade.direction} color={trade.direction === "LONG" ? "#00C896" : "#FF3B5C"} bg={trade.direction === "LONG" ? "rgba(0,200,150,0.1)" : "rgba(255,59,92,0.1)"} />
          </div>
          {[
            { l: "Entry Price", v: fmtPrice(trade.entry_price) },
            { l: "Quantity", v: String(trade.quantity) },
            { l: "Leverage", v: `${trade.leverage}x` },
            { l: "Opened", v: fmtDate(trade.opened_at) },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#4A5568", fontSize: "0.75rem" }}>{l}</span>
              <span style={{ color: "#8892A4", fontSize: "0.78rem", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.3)", borderRadius: 3, padding: "9px 12px", color: "#FF3B5C", fontSize: "0.8rem", marginBottom: 12 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Exit Price</label>
            <input type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="75000" style={inputStyle} autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Closed At</label>
            <input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} style={inputStyle} />
          </div>

          {preview && (
            <div style={{ background: preview.pnl >= 0 ? "rgba(0,200,150,0.06)" : "rgba(255,59,92,0.06)", border: `1px solid ${preview.pnl >= 0 ? "rgba(0,200,150,0.25)" : "rgba(255,59,92,0.25)"}`, borderRadius: 3, padding: "10px 14px", marginBottom: 16 }}>
              <span style={{ color: "#4A5568", fontSize: "0.75rem" }}>PnL: </span>
              <span style={{ color: preview.pnl >= 0 ? "#00C896" : "#FF3B5C", fontWeight: 700, fontSize: "0.88rem" }}>
                {preview.pnl >= 0 ? "+" : ""}{fmtPrice(preview.pnl)} ({preview.pnl_pct >= 0 ? "+" : ""}{preview.pnl_pct.toFixed(2)}%)
              </span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", background: "#FF3B5C", color: "#fff", border: "none", borderRadius: 3, padding: "11px 0", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "default" : "pointer", opacity: loading ? 0.8 : 1 }}>
            {loading ? "Closing..." : "Close Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PortfolioPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [showAddModal, setShowAddModal] = useState(false);
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);

  const fetchTrades = useCallback(async (uid: string) => {
    const { data } = await supabase!
      .from("portfolio_trades")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setTrades((data as Trade[]) ?? []);
  }, []);

  useEffect(() => {
    supabase!.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      fetchTrades(user.id).finally(() => setLoading(false));
    });
  }, [fetchTrades]);

  /* ── Stats ── */
  const openTrades = trades.filter((t) => t.status === "OPEN");
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closedTrades.filter((t) => (t.pnl ?? 0) < 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const bestTrade = closedTrades.reduce<Trade | null>((best, t) => (!best || (t.pnl_pct ?? -Infinity) > (best.pnl_pct ?? -Infinity) ? t : best), null);

  /* ── Performance ── */
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length : 0;
  const totalWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  const sortedClosed = [...closedTrades].sort((a, b) => new Date(a.closed_at ?? 0).getTime() - new Date(b.closed_at ?? 0).getTime());
  let running = 0;
  const cumulativeData = sortedClosed.map((t) => { running += t.pnl ?? 0; return { trade: t, cumulative: running }; });
  const maxAbsCum = Math.max(...cumulativeData.map((d) => Math.abs(d.cumulative)), 1);

  const displayTrades = activeTab === "open" ? openTrades : closedTrades;

  const thStyle: React.CSSProperties = {
    background: "#080C14",
    color: "#4A5568",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "10px 16px",
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #1C2236",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #1C2236",
    fontSize: "0.82rem",
    verticalAlign: "middle",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #1C2236", borderTop: "3px solid #0066FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1.4rem", margin: "0 0 4px" }}>Portfolio Tracker</h1>
          <p style={{ color: "#4A5568", fontSize: "0.82rem", margin: 0 }}>Track your trades and measure performance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: "#0066FF", color: "#fff", border: "none", borderRadius: 3, padding: "9px 18px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span> Add Trade
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Total Trades" value={String(trades.length)} color="#0066FF" />
        <StatCard label="Open Trades" value={String(openTrades.length)} color="#F59E0B" />
        <StatCard label="Win Rate" value={closedTrades.length > 0 ? `${winRate.toFixed(1)}%` : "—"} color="#00C896" sub={`${wins.length}W / ${losses.length}L`} />
        <StatCard label="Total PnL" value={closedTrades.length > 0 ? `${totalPnl >= 0 ? "+" : ""}${fmtPrice(totalPnl)}` : "—"} color={totalPnl >= 0 ? "#00C896" : "#FF3B5C"} />
        <StatCard label="Best Trade" value={bestTrade ? `+${(bestTrade.pnl_pct ?? 0).toFixed(1)}%` : "—"} color="#00C896" sub={bestTrade?.pair} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1C2236", marginBottom: 0 }}>
        {(["open", "closed"] as const).map((t) => {
          const count = t === "open" ? openTrades.length : closedTrades.length;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid #0066FF" : "2px solid transparent", padding: "10px 20px", marginBottom: -1, color: activeTab === t ? "#FFFFFF" : "#4A5568", fontSize: "0.85rem", fontWeight: activeTab === t ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 150ms, border-color 150ms" }}
            >
              {t === "open" ? "Open Trades" : "Closed Trades"}
              <span style={{ background: activeTab === t ? "rgba(0,102,255,0.2)" : "#1C2236", color: activeTab === t ? "#0066FF" : "#4A5568", borderRadius: 999, padding: "1px 7px", fontSize: "0.68rem", fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Trades Table */}
      <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderTop: "none", borderRadius: "0 0 4px 4px", marginBottom: 28, overflow: "hidden" }}>
        {displayTrades.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📊</div>
            <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>No trades yet</div>
            <div style={{ color: "#4A5568", fontSize: "0.82rem", marginBottom: 20 }}>
              {activeTab === "open" ? "Add your first trade to start tracking" : "No closed trades yet"}
            </div>
            {activeTab === "open" && (
              <button onClick={() => setShowAddModal(true)} style={{ background: "#0066FF", color: "#fff", border: "none", borderRadius: 3, padding: "9px 18px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                Add Trade
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Pair</th>
                  <th style={thStyle}>Direction</th>
                  {activeTab === "open" ? (
                    <>
                      <th style={thStyle}>Entry Price</th>
                      <th style={thStyle}>Quantity</th>
                      <th style={thStyle}>Leverage</th>
                      <th style={thStyle}>Opened</th>
                      <th style={thStyle}>Actions</th>
                    </>
                  ) : (
                    <>
                      <th style={thStyle}>Entry</th>
                      <th style={thStyle}>Exit</th>
                      <th style={thStyle}>PnL</th>
                      <th style={thStyle}>PnL %</th>
                      <th style={thStyle}>Quantity</th>
                      <th style={thStyle}>Leverage</th>
                      <th style={thStyle}>Closed</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((trade) => (
                  <tr key={trade.id} style={{ transition: "background 120ms" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <div style={{ color: "#FFFFFF", fontWeight: 700 }}>{trade.pair}</div>
                      <div style={{ color: "#4A5568", fontSize: "0.68rem" }}>Binance</div>
                    </td>
                    <td style={tdStyle}>
                      <Badge
                        text={trade.direction}
                        color={trade.direction === "LONG" ? "#00C896" : "#FF3B5C"}
                        bg={trade.direction === "LONG" ? "rgba(0,200,150,0.1)" : "rgba(255,59,92,0.1)"}
                      />
                    </td>
                    {activeTab === "open" ? (
                      <>
                        <td style={{ ...tdStyle, color: "#E8ECF4" }}>{fmtPrice(trade.entry_price)}</td>
                        <td style={{ ...tdStyle, color: "#8892A4" }}>{trade.quantity}</td>
                        <td style={{ ...tdStyle, color: "#8892A4" }}>{trade.leverage}x</td>
                        <td style={{ ...tdStyle, color: "#4A5568" }}>{fmtDate(trade.opened_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setClosingTrade(trade)}
                              style={{ background: "none", border: "1px solid rgba(255,59,92,0.4)", color: "#FF3B5C", borderRadius: 3, padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...tdStyle, color: "#E8ECF4" }}>{fmtPrice(trade.entry_price)}</td>
                        <td style={{ ...tdStyle, color: "#E8ECF4" }}>{fmtPrice(trade.exit_price)}</td>
                        <td style={tdStyle}>
                          <span style={{ color: (trade.pnl ?? 0) >= 0 ? "#00C896" : "#FF3B5C", fontWeight: 700 }}>
                            {(trade.pnl ?? 0) >= 0 ? "+" : ""}{fmtPrice(trade.pnl)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: (trade.pnl_pct ?? 0) >= 0 ? "#00C896" : "#FF3B5C", fontWeight: 600 }}>
                            {(trade.pnl_pct ?? 0) >= 0 ? "+" : ""}{(trade.pnl_pct ?? 0).toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: "#8892A4" }}>{trade.quantity}</td>
                        <td style={{ ...tdStyle, color: "#8892A4" }}>{trade.leverage}x</td>
                        <td style={{ ...tdStyle, color: "#4A5568" }}>{fmtDate(trade.closed_at)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Overview */}
      {closedTrades.length > 0 && (
        <div>
          <h2 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>Performance Overview</h2>

          {/* Mini stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: "14px 20px", flex: 1, minWidth: 140 }}>
              <div style={{ color: "#4A5568", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Average Win</div>
              <div style={{ color: "#00C896", fontSize: "1.1rem", fontWeight: 700 }}>{wins.length > 0 ? `+${fmtPrice(avgWin)}` : "—"}</div>
            </div>
            <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: "14px 20px", flex: 1, minWidth: 140 }}>
              <div style={{ color: "#4A5568", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Average Loss</div>
              <div style={{ color: "#FF3B5C", fontSize: "1.1rem", fontWeight: 700 }}>{losses.length > 0 ? fmtPrice(avgLoss) : "—"}</div>
            </div>
            <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: "14px 20px", flex: 1, minWidth: 140 }}>
              <div style={{ color: "#4A5568", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Profit Factor</div>
              <div style={{ color: profitFactor >= 1 ? "#00C896" : "#FF3B5C", fontSize: "1.1rem", fontWeight: 700 }}>
                {totalLosses === 0 && totalWins === 0 ? "—" : profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Cumulative PnL bars */}
          <div style={{ background: "#0C1018", border: "1px solid #1C2236", borderRadius: 4, padding: "20px 24px" }}>
            <div style={{ color: "#8892A4", fontSize: "0.75rem", fontWeight: 600, marginBottom: 16 }}>Cumulative PnL by Trade</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, position: "relative" }}>
              {/* Zero line */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #1C2236" }} />
              {cumulativeData.map(({ trade, cumulative }) => {
                const isPositive = cumulative >= 0;
                const height = Math.max((Math.abs(cumulative) / maxAbsCum) * 38, 2);
                return (
                  <div
                    key={trade.id}
                    title={`${trade.pair}: ${cumulative >= 0 ? "+" : ""}${fmtPrice(cumulative)}`}
                    style={{
                      flex: 1,
                      maxWidth: 24,
                      height: height,
                      background: isPositive ? "#00C896" : "#FF3B5C",
                      borderRadius: 2,
                      cursor: "default",
                      alignSelf: isPositive ? "flex-start" : "flex-end",
                      marginTop: isPositive ? "calc(50% - " + height + "px)" : undefined,
                      opacity: 0.8,
                      transition: "opacity 150ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
                  />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ color: "#4A5568", fontSize: "0.65rem" }}>First trade</span>
              <span style={{ color: "#4A5568", fontSize: "0.65rem" }}>Latest</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && userId && (
        <AddTradeModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => fetchTrades(userId)}
        />
      )}
      {closingTrade && userId && (
        <CloseTradeModal
          trade={closingTrade}
          onClose={() => setClosingTrade(null)}
          onSaved={() => fetchTrades(userId)}
        />
      )}
    </div>
  );
}
