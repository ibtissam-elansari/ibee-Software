import { useEffect, useState } from "react";
import { getHiveLatest } from "../api";

export default function HiveCard({ hive, onClick }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getHiveLatest(hive.id).then(setData).catch(() => {});
  }, [hive.id]);

  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ddd",
        padding: "16px",
        borderRadius: "12px",
        cursor: "pointer",
        width: "250px",
      }}
    >
      <h3>{hive.name}</h3>
      <p>{hive.location_name}</p>

      {data ? (
        <>
          <p>🌡 {data.temperature_c} °C</p>
          <p>💧 {data.humidity_pct} %</p>
          <p>🔋 {data.battery_v} V</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}