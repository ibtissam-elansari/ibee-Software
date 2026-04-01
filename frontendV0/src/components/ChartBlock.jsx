import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ChartBlock({ data, dataKey, title }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>{title}</h3>

      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            tickFormatter={(t) => new Date(t).toLocaleTimeString()}
          />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}