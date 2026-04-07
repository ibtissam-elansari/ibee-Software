import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function SignalChart({ data }) {
  const chartData = data.map(d => ({
    time  : (() => { try { return format(parseISO(d.ts), 'HH:mm') } catch { return d.ts } })(),
    'RSSI (dBm)': d.rssi,
    'SNR (dB)': d.snr,
  }))

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        LoRa signal quality
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }} labelStyle={{ color: 'var(--muted)' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
          <Line type="monotone" dataKey="RSSI (dBm)" stroke="#a78bfa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="SNR (dB)"   stroke="#fb923c" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}