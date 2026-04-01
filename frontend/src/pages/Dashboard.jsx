import { useState } from 'react'
import { useHiveData } from '../hooks/useHiveData'
import { format, parseISO } from 'date-fns'
import StatCard          from '../components/StatCard'
import AlertBanner       from '../components/AlertBanner'
import TempHumidityChart from '../components/TempHumidityChart'
import BatteryChart      from '../components/BatteryChart'
import SignalChart       from '../components/SignalChart'
import HiveMap           from '../components/HiveMap'
import HistoryTable      from '../components/HistoryTable'

const fmtTs = (ts) => {
  try { return format(parseISO(ts), 'HH:mm:ss') }
  catch { return '—' }
}

const battPct = (v) => {
  if (!v) return null
  return Math.round(Math.min(100, Math.max(0, ((v - 3.3) / (4.2 - 3.3)) * 100)))
}

export default function Dashboard() {
  const [hiveId, setHiveId] = useState(1)
  const { hives, latest, history, loading, error } = useHiveData(hiveId)

  const currentHive = hives.find(h => h.id === hiveId)

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>🐝</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>
              I-Bee Monitor
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            {currentHive?.location_name
              ? `${currentHive.name} · ${currentHive.location_name}`
              : currentHive?.name || 'Connected hive telemetry'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Hive selector */}
          {hives.length > 1 && (
            <select
              value={hiveId}
              onChange={e => setHiveId(Number(e.target.value))}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              {hives.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}

          {/* Status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--card)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)'}`,
            borderRadius: 20, padding: '8px 16px',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: error ? '#ef4444' : '#4ade80',
              boxShadow: error ? 'none' : '0 0 8px #4ade80',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: error ? '#ef4444' : '#4ade80' }}>
              {error ? 'Error' : loading ? 'Connecting…' : 'Live'}
            </span>
            {latest?.ts && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                · updated {fmtTs(latest.ts)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 24, color: '#ef4444', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Alert banner ── */}
      <AlertBanner latest={latest} />

      {/* ── Stat cards row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
        <StatCard label="Temperature" value={latest?.temperature_c?.toFixed(1)} unit="°C"  accent="#f97316" icon="🌡️" />
        <StatCard label="Humidity"    value={latest?.humidity_pct?.toFixed(1)}  unit="%"   accent="#38bdf8" icon="💧" />
        <StatCard label="Battery"     value={battPct(latest?.battery_v)}         unit="%"   accent="#4ade80" icon="🔋" alert={latest?.battery_v < 3.5} />
        <StatCard label="Battery V"   value={latest?.battery_v?.toFixed(2)}      unit="V"   accent="#4ade80" icon="⚡" />
      </div>

      {/* ── Stat cards row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="Door"   value={latest?.door_open ? 'Open' : 'Closed'} unit="" accent={latest?.door_open ? '#ef4444' : '#4ade80'} icon="🚪" alert={latest?.door_open} />
        <StatCard label="Sound"  value={latest?.sound_level > 0 ? `Level ${latest.sound_level}` : 'Quiet'} unit="" accent={latest?.sound_level > 0 ? '#f97316' : '#4ade80'} icon="🔊" alert={latest?.sound_level > 0} />
        <StatCard label="RSSI"   value={latest?.rssi}                            unit="dBm" accent="#a78bfa" icon="📡" />
        <StatCard label="SNR"    value={latest?.snr?.toFixed(1)}                 unit="dB"  accent="#fb923c" icon="〰️" />
      </div>

      {/* ── Main chart ── */}
      <div style={{ marginBottom: 14 }}>
        <TempHumidityChart data={history} />
      </div>

      {/* ── Battery + Signal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <BatteryChart data={history} />
        <SignalChart  data={history} />
      </div>

      {/* ── Map + Table ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 32 }}>
        <HiveMap latest={latest} hiveName={currentHive?.name} />
        <HistoryTable data={history} />
      </div>

      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.05em' }}>
        I-BEE v1.0 · agri4.0 · polling every 10 s · device {latest?.device_dev_eui || '—'}
      </div>
    </div>
  )
}