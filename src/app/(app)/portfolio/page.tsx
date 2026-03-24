'use client'

export default function PortfolioPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      gap: 16,
    }}>
      <div style={{ fontSize: '3rem' }}>📊</div>
      <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        Portfolio Tracker
      </h1>
      <p style={{ color: '#8892A4', maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
        Personal portfolio tracking is coming soon.
        Track your trades, calculate PnL, and monitor
        your performance in real time.
      </p>
      <div style={{
        padding: '8px 20px',
        background: 'rgba(0,102,255,0.1)',
        border: '1px solid rgba(0,102,255,0.3)',
        borderRadius: 20,
        color: '#0066FF',
        fontSize: '0.82rem',
        fontWeight: 600,
      }}>
        Coming Soon
      </div>
    </div>
  )
}
