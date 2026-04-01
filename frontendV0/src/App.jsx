import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import HiveDetail from "./pages/HiveDetail";

export default function App() {
  const [selectedHive, setSelectedHive] = useState(null);

  return (
    <div style={{ padding: "20px" }}>
      {!selectedHive ? (
        <Dashboard onSelectHive={setSelectedHive} />
      ) : (
        <HiveDetail
          hive={selectedHive}
          onBack={() => setSelectedHive(null)}
        />
      )}
    </div>
  );
}