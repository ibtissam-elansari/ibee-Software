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
  const { hives, latest, history, stats, loading, error } = useHiveData(hiveId)

  const currentHive = hives.find(h => h.id === hiveId)

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 32,
        flexWrap: 'wrap', gap: 16,
      }}>
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

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--card)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)'}`,
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

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '14px 20px', marginBottom: 24,
          color: '#ef4444', fontSize: 14,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Alert banner ── */}
      <AlertBanner latest={latest} />

      {/* ── Row 1: live sensor values ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 14,
      }}>
        <StatCard label="Temperature" value={latest?.temperature_c?.toFixed(1)} unit="°C"  accent="#f97316" icon="🌡️" />
        <StatCard label="Humidity"    value={latest?.humidity_pct?.toFixed(1)}  unit="%"   accent="#38bdf8" icon="💧" />
        <StatCard label="Battery"     value={battPct(latest?.battery_v)}         unit="%"   accent="#4ade80" icon="🔋" alert={latest?.battery_v != null && latest.battery_v < 3.5} />
        <StatCard label="Battery V"   value={latest?.battery_v?.toFixed(2)}      unit="V"   accent="#4ade80" icon="⚡" />
      </div>

      {/* ── Row 2: status + signal ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14, marginBottom: 14,
      }}>
        <StatCard
          label="Door"
          value={latest?.door_open != null ? (latest.door_open ? 'Open' : 'Closed') : null}
          unit=""
          accent={latest?.door_open ? '#ef4444' : '#4ade80'}
          icon="🚪"
          alert={latest?.door_open}
        />
        <StatCard
          label="Sound"
          value={latest?.sound_level != null ? (latest.sound_level > 50 ? `Level ${latest.sound_level}` : 'Quiet') : null}
          unit=""
          accent={latest?.sound_level > 50 ? '#f97316' : '#4ade80'}
          icon="🔊"
          alert={latest?.sound_level > 50}
        />
        <StatCard label="RSSI" value={latest?.rssi}            unit="dBm" accent="#a78bfa" icon="📡" />
        <StatCard label="SNR"  value={latest?.snr?.toFixed(1)} unit="dB"  accent="#fb923c" icon="〰️" />
      </div>

      {/* ── Row 3: aggregate stats (shown once stats load) ── */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <StatCard label="Total readings"   value={stats.total_measurements}            unit=""   accent="#94a3b8" icon="📊" />
          <StatCard label="Avg temperature"  value={stats.avg_temperature_c?.toFixed(1)} unit="°C" accent="#f97316" icon="📈" />
          <StatCard label="Avg humidity"     value={stats.avg_humidity_pct?.toFixed(1)}  unit="%"  accent="#38bdf8" icon="📈" />
          <StatCard label="Sound events"     value={stats.sound_events}                  unit=""   accent="#f97316" icon="🔊" alert={stats.sound_events > 0} />
          <StatCard label="Door open events" value={stats.door_open_events}              unit=""   accent="#e76f51" icon="🚪" alert={stats.door_open_events > 0} />
          <StatCard label="Min battery"      value={stats.min_battery_v?.toFixed(2)}     unit="V"  accent="#4ade80" icon="🔋" alert={stats.min_battery_v != null && stats.min_battery_v < 3.5} />
        </div>
      )}

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

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.05em' }}>
        I-BEE v1.0 · agri4.0 · live via SSE · device {latest?.device_dev_eui || '—'}
        {stats?.first_seen && (
          <> · data since {format(parseISO(stats.first_seen), 'MMM d, yyyy')}</>
        )}
      </div>

    </div>
  )
}