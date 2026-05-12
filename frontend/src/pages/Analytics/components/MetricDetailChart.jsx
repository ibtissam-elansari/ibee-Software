/**
 * MetricDetailChart.jsx
 *
 * Keeps the existing clean line chart style.
 * Fixes:
 *  1. Y-axis domain — padded from actual data min/max, not 'auto' (which recharts
 *     sometimes miscomputes when data has few points)
 *  2. Tooltip hover coverage — replaced interval={calcInterval} with
 *     interval={0} on XAxis so every data point is a hover target, but
 *     only ~8 labels are SHOWN via tickFormatter that suppresses most labels.
 *     This decouples "which points are hoverable" from "which ticks are shown".
 *  3. Chart container height is now 100% of parent, but parent in
 *     MetricDetailPage needs a fixed px height (see note at bottom).
 *  4. chartThreshold comes from props (per-hive, from useMetricDetail)
 *     instead of METRIC_CONFIG (hardcoded).
 */
import React, { useMemo } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'

// ── Y-axis domain with 10% padding ───────────────────────────────────────────
function computeDomain(data, chartThreshold) {
  if (!data?.length) return ['auto', 'auto']
  const vals = data.map(d => d.value).filter(v => v != null)
  if (!vals.length) return ['auto', 'auto']

  let lo = Math.min(...vals)
  let hi = Math.max(...vals)

  // Include threshold in domain so reference line is always visible
  if (chartThreshold != null) {
    lo = Math.min(lo, chartThreshold)
    hi = Math.max(hi, chartThreshold)
  }

  const pad = Math.max((hi - lo) * 0.12, 1)
  return [
    parseFloat((lo - pad).toFixed(1)),
    parseFloat((hi + pad).toFixed(1)),
  ]
}

// ── Smart tick label suppressor ───────────────────────────────────────────────
// interval={0} makes every point hoverable.
// We suppress most labels manually so only ~8 appear.
function makeTickFormatter(dataLength, maxLabels = 8) {
  const step = Math.max(1, Math.ceil(dataLength / maxLabels))
  return (value, index) => index % step === 0 ? value : ''
}

// ── Alert dot — only on threshold-crossing points ─────────────────────────────
const AlertDot = (props) => {
  const { cx, cy, payload, chartThreshold } = props
  if (payload?.value == null || chartThreshold == null) return null
  if (payload.value <= chartThreshold) return null
  return <circle cx={cx} cy={cy} r={3.5} fill="#EF4444" stroke="white" strokeWidth={1.5} />
}

// ── Main ──────────────────────────────────────────────────────────────────────
const MetricDetailChart = ({
  data,
  metric,
  unit,
  color,          // from METRIC_CONFIG[metric].chartColor — passed by MetricDetailPage
  chartThreshold, // from useMetricDetail — per-hive scaled threshold, may be null
  isLoading,
}) => {
  const domain        = useMemo(() => computeDomain(data, chartThreshold), [data, chartThreshold])
  const tickFormatter = useMemo(() => makeTickFormatter(data?.length ?? 0, 8), [data?.length])

  if (isLoading) return (
    <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse" />
  )

  if (!data?.length) return (
    <div className="w-full h-full flex items-center justify-center
                    bg-gray-50 rounded-xl text-sm text-gray-300">
      Pas encore de données
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 20, left: -4, bottom: 4 }}>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(0,0,0,0.05)"
          vertical={false}
        />

        {/* interval={0} = every point is hoverable; formatter hides most labels */}
        <XAxis
          dataKey="time"
          interval={0}
          tickFormatter={tickFormatter}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />

        {/* Domain computed from actual data — avoids recharts auto-domain quirks */}
        <YAxis
          domain={domain}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}${unit}`}
          width={54}
        />

        {/* Per-hive threshold reference line */}
        {chartThreshold != null && (
          <ReferenceLine
            y={chartThreshold}
            stroke="#FCA5A5"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{
              value    : `Seuil · ${chartThreshold}${unit}`,
              position : 'insideTopRight',
              fontSize : 9,
              fill     : '#F87171',
              fontWeight: 600,
            }}
          />
        )}

        <Tooltip
          content={<ChartTooltip unit={unit} />}
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />

        <Line
          type="monotoneX"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          connectNulls
          dot={
            chartThreshold != null
              ? <AlertDot chartThreshold={chartThreshold} />
              : false
          }
          activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
        />

      </LineChart>
    </ResponsiveContainer>
  )
}

export default MetricDetailChart

/*
 * NOTE — chart container height in MetricDetailPage.jsx
 * ──────────────────────────────────────────────────────
 * ResponsiveContainer with height="100%" requires a parent with a fixed
 * pixel height. Change:
 *
 *   <div style={{ height: 300 }}>          ← already correct in your code
 *     <MetricDetailChart ... />
 *   </div>
 *
 * And pass the two new props:
 *
 *   import { METRIC_CONFIG } from '../config/metricConfig'
 *   const cfg = METRIC_CONFIG[metric] ?? METRIC_CONFIG.temperature
 *
 *   <MetricDetailChart
 *     data={chartData}
 *     metric={metric}
 *     unit={unit}
 *     color={cfg.chartColor}           ← ADD
 *     chartThreshold={chartThreshold}  ← already returned by useMetricDetail
 *     isLoading={isLoading}
 *   />
 */