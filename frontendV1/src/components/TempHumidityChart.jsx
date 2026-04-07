import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'

const fmt = (ts) => {
  try { return format(parseISO(ts), 'HH:mm') }
  catch { return ts }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value?.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function TempHumidityChart({ data }) {
  const chartData = data.map(d => ({
    time    : fmt(d.ts),
    'Temp (°C)' : d.temperature_c,
    'Humidity (%)': d.humidity_pct,
  }))

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Temperature &amp; Humidity
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis yAxisId="t" domain={[20, 50]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis yAxisId="h" orientation="right" domain={[30, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />
          <Line yAxisId="t" type="monotone" dataKey="Temp (°C)"     stroke="#f97316" strokeWidth={2} dot={false} />
          <Line yAxisId="h" type="monotone" dataKey="Humidity (%)"  stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}