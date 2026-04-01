import { useEffect, useState } from "react";
import { getHives } from "../api";
import HiveCard from "../components/HiveCard";

export default function Dashboard({ onSelectHive }) {
  const [hives, setHives] = useState([]);

  useEffect(() => {
    getHives().then(setHives);
  }, []);

  return (
    <div>
      <h1>🐝 Hive Dashboard</h1>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {hives.map((hive) => (
          <HiveCard
            key={hive.id}
            hive={hive}
            onClick={() => onSelectHive(hive)}
          />
        ))}
      </div>
    </div>
  );
}