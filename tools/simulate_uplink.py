#!/usr/bin/env python3
"""
Multi-hive simulator — sends LoRaWAN-style uplink payloads to the webhook.
Change WEBHOOK_URL to switch between local and production.

Usage:
  # Production (Railway)
  python simulate_uplink.py

  # Local
  WEBHOOK_URL=http://localhost:8000 python simulate_uplink.py
"""

import json
import os
import random
import time
from datetime import datetime, timezone
from urllib import request

# ── Config ───────────────────────────────────────────────────────────────

BACKEND_URL      = os.getenv("WEBHOOK_URL", "https://ibee-backend-production.up.railway.app")
WEBHOOK_URL      = f"{BACKEND_URL}/webhooks/chirpstack/uplink"
INTERVAL_SECONDS = int(os.getenv("INTERVAL", str(15 * 60)))  # 15 min default, override with env

DEVICES = [
    "70b3d57ed0064a12",
    "70b3d57ed0064a13",
    "70b3d57ed0064a14",
    "70b3d57ed0064a15",
    "70b3d57ed0064a16",
    "70b3d57ed0064a17",
    "70b3d57ed0064a18",
    "70b3d57ed0064a19",
    "70b3d57ed0064a20",
    "70b3d57ed0064a21",
]

DEVICE_LOCATIONS = {
    "70b3d57ed0064a12": (35.6895, -0.6417),
    "70b3d57ed0064a13": (35.6898, -0.6415),
    "70b3d57ed0064a14": (35.6892, -0.6419),
    "70b3d57ed0064a15": (35.6896, -0.6413),
    "70b3d57ed0064a16": (35.6898, -0.6412),
    "70b3d57ed0064a17": (35.6900, -0.6415),
    "70b3d57ed0064a18": (35.6920, -0.6420),
    "70b3d57ed0064a19": (35.6940, -0.6425),
    "70b3d57ed0064a20": (35.6960, -0.6430),
    "70b3d57ed0064a21": (35.6980, -0.6435),
}

device_steps   = {dev: 0 for dev in DEVICES}
device_offsets = {dev: random.uniform(-1.0, 1.0) for dev in DEVICES}
device_weights = {dev: random.uniform(12.0, 25.0) for dev in DEVICES}


# ── HTTP helper ──────────────────────────────────────────────────────────

def post_json(url: str, payload: dict) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req  = request.Request(
        url=url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode("utf-8")


# ── Data generators ──────────────────────────────────────────────────────

def update_weight(dev_eui: str) -> float:
    w  = device_weights[dev_eui]
    w += random.uniform(0.02, 0.20)
    if random.random() < 0.01:
        w = max(8.0, w - random.uniform(2.0, 8.0))
    w = max(8.0, min(60.0, w))
    device_weights[dev_eui] = w
    return round(w, 3)


def generate_measurement(dev_eui: str, step: int, lat: float, lng: float, offset: float) -> dict:
    alert_mode = random.random() < 0.15

    temp  = round(random.uniform(36.0, 42.0) if alert_mode else 33.5 + offset + random.uniform(-1.5, 1.5), 2)
    hum   = round(random.uniform(71.0, 85.0) if alert_mode else 62.0 + offset + random.uniform(-6.0, 6.0), 2)
    sound = max(10, min(100, int(random.uniform(75, 95) if alert_mode else 40 + random.uniform(-20, 20))))
    batt  = round(3.95 - min(0.5, step * 0.0005) + random.uniform(-0.01, 0.01), 3)

    return {
        "temperature_c": temp,
        "humidity_pct" : hum,
        "sound_level"  : sound,
        "door_open"    : random.random() < 0.05,
        "weight_kg"    : update_weight(dev_eui),
        "gps_lat"      : round(lat + random.uniform(-0.0002, 0.0002), 6),
        "gps_lng"      : round(lng + random.uniform(-0.0002, 0.0002), 6),
        "battery_v"    : batt,
    }


def build_payload(dev_eui: str, step: int, lat: float, lng: float, offset: float) -> dict:
    return {
        "devEui": dev_eui,
        "time"  : datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "rxInfo": [{"rssi": random.randint(-95, -45), "snr": round(random.uniform(4.0, 11.0), 1)}],
        "object": generate_measurement(dev_eui, step, lat, lng, offset),
    }


# ── Main loop ────────────────────────────────────────────────────────────

def main() -> None:
    print("🐝 IBEE Multi-hive simulator")
    print(f"→ Target  : {WEBHOOK_URL}")
    print(f"→ Devices : {len(DEVICES)}")
    print(f"→ Interval: {INTERVAL_SECONDS}s ({INTERVAL_SECONDS // 60}min)")
    print(f"→ Tip: set INTERVAL=5 env var to send every 5 seconds for quick testing\n")

    while True:
        for dev_eui in DEVICES:
            step     = device_steps[dev_eui]
            lat, lng = DEVICE_LOCATIONS[dev_eui]
            offset   = device_offsets[dev_eui]
            payload  = build_payload(dev_eui, step, lat, lng, offset)

            try:
                status, body = post_json(WEBHOOK_URL, payload)
                obj = payload["object"]
                print(
                    f"[{dev_eui[-4:]}] "
                    f"T={obj['temperature_c']}°C  "
                    f"H={obj['humidity_pct']}%  "
                    f"W={obj['weight_kg']}kg  "
                    f"→ HTTP {status}"
                )
            except Exception as exc:
                print(f"[{dev_eui[-4:]}] ✗ {exc}")

            device_steps[dev_eui] += 1

        print(f"  ↻ Next batch in {INTERVAL_SECONDS}s...\n")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()