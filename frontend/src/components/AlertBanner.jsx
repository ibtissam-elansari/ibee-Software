export default function AlertBanner({ latest }) {
  if (!latest) return null
  const alerts = []
  if (latest.door_open)              alerts.push({ icon: '🔓', text: 'Hive door is open' })
  if (latest.sound_level > 0)        alerts.push({ icon: '🔊', text: `Sound activity detected (level ${latest.sound_level})` })
  if (latest.battery_v < 3.5)        alerts.push({ icon: '🪫', text: `Low battery — ${latest.battery_v?.toFixed(2)}V` })
  if (!alerts.length) return null

  return (
    <div style={{
      background   : 'rgba(239,68,68,0.07)',
      border       : '1px solid rgba(239,68,68,0.35)',
      borderRadius : 12,
      padding      : '14px 20px',
      display      : 'flex',
      flexWrap     : 'wrap',
      gap          : '10px 24px',
      marginBottom : 24,
    }}>
      {alerts.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{a.icon}</span>
          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>{a.text}</span>
        </div>
      ))}
    </div>
  )
}