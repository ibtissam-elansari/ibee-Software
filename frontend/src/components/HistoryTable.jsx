import { format, parseISO } from 'date-fns'

const fmtTs = (ts) => {
  try { return format(parseISO(ts), 'MMM d, HH:mm:ss') }
  catch { return ts }
}

const TH = ({ children }) => (
  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)

const TD = ({ children, alert }) => (
  <td style={{ padding: '10px 14px', fontSize: 13, color: alert ? '#ef4444' : 'var(--text)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
    {children ?? '—'}
  </td>
)

export default function HistoryTable({ data }) {
  // Show newest first in table
  const rows = [...data].reverse().slice(0, 50)

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 14px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        History — last 50 readings
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>Time</TH>
              <TH>Temp (°C)</TH>
              <TH>Humidity (%)</TH>
              <TH>Sound</TH>
              <TH>Door</TH>
              <TH>Battery (V)</TH>
              <TH>RSSI</TH>
              <TH>SNR</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <TD>{fmtTs(r.ts)}</TD>
                <TD>{r.temperature_c?.toFixed(1)}</TD>
                <TD>{r.humidity_pct?.toFixed(1)}</TD>
                <TD alert={r.sound_level > 0}>{r.sound_level > 0 ? `🔊 ${r.sound_level}` : '—'}</TD>
                <TD alert={r.door_open}>{r.door_open ? '🔓 Open' : '🔒 Closed'}</TD>
                <TD alert={r.battery_v < 3.5}>{r.battery_v?.toFixed(2)}</TD>
                <TD>{r.rssi}</TD>
                <TD>{r.snr?.toFixed(1)}</TD>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>
            No data yet — is the simulator running?
          </div>
        )}
      </div>
    </div>
  )
}