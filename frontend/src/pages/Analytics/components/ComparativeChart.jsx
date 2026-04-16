import React from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const LINES = [
  { key: 'Température (°C)',    color: '#D97706' },
  { key: 'Humidité (%)',        color: '#3B82F6' },
  { key: 'Niveau Sonore (Hz)', color: '#22C55E' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 text-white rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name.split(' ')[0]}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const ComparativeChart = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />;
  }
  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-300">
        Pas encore de données
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {LINES.map(({ key, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            connectNulls
            activeDot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ComparativeChart;