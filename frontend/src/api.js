const API_BASE = "http://localhost:8000";

export async function getHives() {
  const res = await fetch(`${API_BASE}/hives`);
  return res.json();
}

export async function getHiveLatest(hiveId) {
  const res = await fetch(`${API_BASE}/hives/${hiveId}/latest`);
  return res.json();
}

export async function getDeviceHistory(devEui) {
  const res = await fetch(`${API_BASE}/devices/${devEui}/history`);
  return res.json();
}