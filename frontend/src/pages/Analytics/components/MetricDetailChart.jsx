import React from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const METRIC_COLOR = {
  temperature : '#D97706',
  humidity    : '#3B82F6',
  sound       : '#22C55E',
};

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-gray-800 text-white rounded-xl px-3 py-2 text-xs shadow-xl min-w-[100px]">
      <p className="font-bold text-sm mb-0.5">{p.value}{unit}</p>
      <p className="text-gray-400">{p.payload.tooltip}</p>
    </div>
  );
};

const MetricDetailChart = ({ data, metric, unit, isLoading }) => {
  const color = METRIC_COLOR[metric] ?? '#22C55E';

  if (isLoading) return <div className="h-56 bg-gray-50 rounded-xl animate-pulse" />;

  if (!data?.length) {
    return (
      <div className="h-56 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
        Pas encore de données
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}${unit}`}
        />
        <Tooltip
          content={<CustomTooltip unit={unit} />}
          cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          connectNulls
          activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MetricDetailChart;