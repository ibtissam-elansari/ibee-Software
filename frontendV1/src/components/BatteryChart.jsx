import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function BatteryChart({ data }) {
  const chartData = data.map(d => ({
    time   : (() => { try { return format(parseISO(d.ts), 'HH:mm') } catch { return d.ts } })(),
    'Battery (V)': d.battery_v,
  }))

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Battery voltage
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis domain={[3.0, 4.3]} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
            labelStyle={{ color: 'var(--muted)' }}
          />
          <Area type="monotone" dataKey="Battery (V)" stroke="#4ade80" fill="url(#battGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}