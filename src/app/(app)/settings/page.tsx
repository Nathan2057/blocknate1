"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Palette,
  Bell,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Save,
  Check,
} from "lucide-react";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function saveSettings(key: string, value: unknown) {
  try {
    localStorage.setItem(`blocknate_${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
}

function loadSettings<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`blocknate_${key}`);
    return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// ─── Settings state type ──────────────────────────────────────────────────────

interface Settings {
  theme: string;
  notif_signals: boolean;
  notif_news: boolean;
  notif_price_alerts: boolean;
  dashboard_show_ticker: boolean;
  dashboard_show_fear_greed: boolean;
  dashboard_show_live_signals: boolean;
  dashboard_show_market_movers: boolean;
  default_pair: string;
  default_leverage: number;
}

function loadAllSettings(): Settings {
  return {
    theme:                        loadSettings("theme", "dark"),
    notif_signals:                loadSettings("notif_signals", true),
    notif_news:                   loadSettings("notif_news", true),
    notif_price_alerts:           loadSettings("notif_price_alerts", true),
    dashboard_show_ticker:        loadSettings("dashboard_show_ticker", true),
    dashboard_show_fear_greed:    loadSettings("dashboard_show_fear_greed", true),
    dashboard_show_live_signals:  loadSettings("dashboard_show_live_signals", true),
    dashboard_show_market_movers: loadSettings("dashboard_show_market_movers", true),
    default_pair:                 loadSettings("default_pair", "BTC/USDT"),
    default_leverage:             loadSettings("default_leverage", 10),
  };
}

// ─── Small components ─────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "success" ? "rgba(0,200,150,0.12)" : "rgba(255,59,92,0.12)",
      border: `1px solid ${type === "success" ? "#00C896" : "#FF3B5C"}`,
      borderRadius: 4, padding: "12px 20px",
      color: type === "success" ? "#00C896" : "#FF3B5C",
      fontSize: "0.85rem", fontWeight: 600,
      display: "flex", alignItems: "center", gap: 8,
      minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "slideUp 200ms ease",
    }}>
      {type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
      {message}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11,
      background: checked ? "#0066FF" : "#1C2236",
      border: `1px solid ${checked ? "#0066FF" : "#2A3350"}`,
      position: "relative", cursor: "pointer",
      transition: "background 200ms, border-color 200ms", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2,
        left: checked ? 19 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 200ms",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(6,8,15,0.8)", border: "1px solid #1C2236",
  borderRadius: 3, padding: "9px 12px", color: "#E8ECF4", fontSize: "0.85rem",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", color: "#8892A4", fontSize: "0.72rem", fontWeight: 600,
  letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6,
};

const sectionTitle: React.CSSProperties = {
  color: "#FFFFFF", fontWeight: 700, fontSize: "0.95rem", marginBottom: 4,
};

const sectionDesc: React.CSSProperties = {
  color: "#4A5568", fontSize: "0.78rem", marginBottom: 20,
};

const card: React.CSSProperties = {
  background: "rgba(12,16,24,0.7)", border: "1px solid #1C2236",
  borderRadius: 4, padding: 24, marginBottom: 16,
};

const rowBetween: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { id: "trading",       label: "Trading",       icon: TrendingUp },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "DOGE/USDT", "ADA/USDT", "AVAX/USDT"];

const THEMES = [
  { id: "dark",     label: "Dark",      bg: "#06080F", accent: "#0066FF", desc: "Default dark theme" },
  { id: "midnight", label: "Midnight",  bg: "#080010", accent: "#7C3AED", desc: "Deep purple tones" },
  { id: "carbon",   label: "Carbon",    bg: "#0A0A0A", accent: "#00C896", desc: "Pure black + green" },
  { id: "navy",     label: "Navy Blue", bg: "#050B18", accent: "#38BDF8", desc: "Ocean-inspired" },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Tab components ───────────────────────────────────────────────────────────

function AppearanceTab({ settings, update }: { settings: Settings; update: (k: keyof Settings, v: unknown) => void }) {
  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>Theme</p>
        <p style={sectionDesc}>Choose your preferred color theme. More themes coming soon.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {THEMES.map((t) => {
            const active = settings.theme === t.id;
            return (
              <div key={t.id} onClick={() => update("theme", t.id)} style={{
                border: `2px solid ${active ? t.accent : "#1C2236"}`,
                borderRadius: 6, padding: 16, cursor: "pointer",
                background: active ? `rgba(${hexToRgb(t.accent)},0.06)` : "rgba(28,34,54,0.3)",
                transition: "all 150ms", position: "relative",
              }}>
                {active && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    width: 18, height: 18, borderRadius: "50%",
                    background: t.accent, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
                <div style={{
                  height: 40, borderRadius: 4, background: t.bg,
                  border: "1px solid #2A3350", marginBottom: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.accent }} />
                  <div style={{ width: 30, height: 3, borderRadius: 2, background: t.accent, opacity: 0.4 }} />
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: "#1C2236" }} />
                </div>
                <p style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.85rem", margin: "0 0 2px" }}>{t.label}</p>
                <p style={{ color: "#4A5568", fontSize: "0.72rem", margin: 0 }}>{t.desc}</p>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 16, padding: "10px 14px",
          background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.15)",
          borderRadius: 3, color: "#4A5568", fontSize: "0.75rem",
        }}>
          Theme preference is saved locally. Full theme application across the platform is coming in a future update.
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ settings, update }: { settings: Settings; update: (k: keyof Settings, v: unknown) => void }) {
  const widgets: { key: keyof Settings; label: string; desc: string }[] = [
    { key: "dashboard_show_ticker",        label: "Market Ticker",      desc: "Live price ticker at the top of the dashboard" },
    { key: "dashboard_show_fear_greed",    label: "Fear & Greed Index", desc: "Market sentiment gauge widget" },
    { key: "dashboard_show_live_signals",  label: "Live Signals Feed",  desc: "Recent trading signals on the dashboard" },
    { key: "dashboard_show_market_movers", label: "Market Movers",      desc: "Top gainers and losers section" },
  ];
  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>Dashboard Widgets</p>
        <p style={sectionDesc}>Choose which widgets appear on your dashboard.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {widgets.map((w, i) => (
            <div key={w.key} style={{
              ...rowBetween, padding: "14px 0",
              borderBottom: i < widgets.length - 1 ? "1px solid #1C2236" : "none",
            }}>
              <div>
                <p style={{ color: "#E8ECF4", fontWeight: 600, fontSize: "0.85rem", margin: "0 0 2px" }}>{w.label}</p>
                <p style={{ color: "#4A5568", fontSize: "0.75rem", margin: 0 }}>{w.desc}</p>
              </div>
              <Toggle checked={settings[w.key] as boolean} onChange={(v) => update(w.key, v)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradingTab({ settings, update }: { settings: Settings; update: (k: keyof Settings, v: unknown) => void }) {
  const [leverage, setLeverage] = useState(String(settings.default_leverage));
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    update("default_leverage", Number(leverage) || 1);
    setTimeout(() => setSaving(false), 400);
  };

  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>Trading Defaults</p>
        <p style={sectionDesc}>Set your default values for trading preferences.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Default Pair</label>
            <select value={settings.default_pair} onChange={(e) => update("default_pair", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Default Leverage</label>
            <div style={{ position: "relative" }}>
              <input type="number" min={1} max={125} value={leverage}
                onChange={(e) => setLeverage(e.target.value)} style={inputStyle} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#4A5568", fontSize: "0.78rem", pointerEvents: "none" }}>×</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Quick Select</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 5, 10, 20, 25, 50, 100, 125].map((lev) => (
              <button key={lev} onClick={() => setLeverage(String(lev))} style={{
                padding: "5px 12px", borderRadius: 3,
                border: `1px solid ${String(lev) === leverage ? "#0066FF" : "#1C2236"}`,
                background: String(lev) === leverage ? "rgba(0,102,255,0.15)" : "transparent",
                color: String(lev) === leverage ? "#0066FF" : "#8892A4",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              }}>{lev}×</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <button onClick={save} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#0066FF", color: "#fff", border: "none", borderRadius: 3,
            padding: "9px 20px", fontWeight: 700, fontSize: "0.85rem",
            cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            <Save size={13} />
            Save Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ settings, update }: { settings: Settings; update: (k: keyof Settings, v: unknown) => void }) {
  const items: { key: keyof Settings; label: string; desc: string }[] = [
    { key: "notif_signals",      label: "Live Signals",     desc: "Get notified when new trading signals are published" },
    { key: "notif_news",         label: "News & Sentiment", desc: "Breaking crypto news and sentiment updates" },
    { key: "notif_price_alerts", label: "Price Alerts",     desc: "Significant price movements for tracked assets" },
  ];
  return (
    <div>
      <div style={card}>
        <p style={sectionTitle}>Notification Preferences</p>
        <p style={sectionDesc}>Choose what you want to be notified about.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((item, i) => (
            <div key={item.key} style={{
              ...rowBetween, padding: "14px 0",
              borderBottom: i < items.length - 1 ? "1px solid #1C2236" : "none",
            }}>
              <div>
                <p style={{ color: "#E8ECF4", fontWeight: 600, fontSize: "0.85rem", margin: "0 0 2px" }}>{item.label}</p>
                <p style={{ color: "#4A5568", fontSize: "0.75rem", margin: 0 }}>{item.desc}</p>
              </div>
              <Toggle checked={settings[item.key] as boolean} onChange={(v) => update(item.key, v)} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...card, background: "rgba(0,102,255,0.05)", borderColor: "rgba(0,102,255,0.15)" }}>
        <p style={{ color: "#8892A4", fontSize: "0.78rem", margin: 0 }}>
          In-app notifications are coming soon. Email and push notifications will be configurable in a future update.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("appearance");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setSettings(loadAllSettings());
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  const update = useCallback((key: keyof Settings, value: unknown) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      saveSettings(key, value);
      return next;
    });
    showToast("Settings saved");
  }, [showToast]);

  if (!settings) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "1.5rem", margin: 0 }}>Settings</h1>
        <p style={{ color: "#4A5568", fontSize: "0.82rem", marginTop: 4 }}>
          Manage your platform preferences
        </p>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Sidebar nav */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ background: "rgba(12,16,24,0.7)", border: "1px solid #1C2236", borderRadius: 4, overflow: "hidden" }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  background: active ? "rgba(0,102,255,0.1)" : "transparent",
                  border: "none", borderLeft: active ? "2px solid #0066FF" : "2px solid transparent",
                  cursor: "pointer", color: active ? "#FFFFFF" : "#8892A4",
                  fontSize: "0.82rem", fontWeight: active ? 600 : 400,
                  textAlign: "left", transition: "all 150ms",
                }}>
                  <Icon size={14} style={{ color: active ? "#0066FF" : "#4A5568", flexShrink: 0 }} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === "appearance"    && <AppearanceTab    settings={settings} update={update} />}
          {activeTab === "dashboard"     && <DashboardTab     settings={settings} update={update} />}
          {activeTab === "trading"       && <TradingTab       settings={settings} update={update} />}
          {activeTab === "notifications" && <NotificationsTab settings={settings} update={update} />}
        </div>
      </div>
    </div>
  );
}
