export default function StatCard({ label, value, unit, accent, alert, icon }) {
  return (
    <div style={{
      background  : alert ? 'rgba(239,68,68,0.08)' : 'var(--card)',
      border      : `1px solid ${alert ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
      borderRadius: 14,
      padding     : '20px 24px',
      display     : 'flex',
      flexDirection: 'column',
      gap         : 10,
      transition  : 'border-color 0.3s, background 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: alert ? '#ef4444' : (accent || 'var(--text)') }}>
          {value ?? '—'}
        </span>
        {unit && (
          <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{unit}</span>
        )}
      </div>
    </div>
  )
}