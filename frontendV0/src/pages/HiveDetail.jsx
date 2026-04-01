import { useEffect, useState } from "react";
import { getHiveLatest, getDeviceHistory } from "../api";
import ChartBlock from "../components/ChartBlock";

export default function HiveDetail({ hive, onBack }) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function load() {
      const latestData = await getHiveLatest(hive.id);
      setLatest(latestData);

      const hist = await getDeviceHistory(latestData.device_dev_eui);
      setHistory(hist.reverse());
    }

    load();
  }, [hive]);

  return (
    <div>
      <button onClick={onBack}>⬅ Back</button>

      <h2>{hive.name}</h2>

      {latest && (
        <div>
          <p>🌡 {latest.temperature_c} °C</p>
          <p>💧 {latest.humidity_pct} %</p>
          <p>🔋 {latest.battery_v} V</p>
        </div>
      )}

      <ChartBlock data={history} dataKey="temperature_c" title="Temperature" />
      <ChartBlock data={history} dataKey="humidity_pct" title="Humidity" />
      <ChartBlock data={history} dataKey="battery_v" title="Battery" />
    </div>
  );
}