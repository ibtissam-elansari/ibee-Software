#!/usr/bin/env python3
"""
Multi-hive simulator — sends LoRaWAN-style uplink payloads to the local webhook.
Each hive sends every INTERVAL_SECONDS. Alert events are injected randomly in between.
Now includes weight_kg (hive production weight) with realistic drift and production peaks.
"""

import json
import random
import time
from datetime import datetime, timezone
from urllib import request

# ── Config ───────────────────────────────────────────────────────────────

WEBHOOK_URL      = "http://localhost:8000/webhooks/chirpstack/uplink"
INTERVAL_SECONDS = 15 * 60   # 15 minutes between normal readings

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

device_steps   = {dev: 0  for dev in DEVICES}
device_offsets = {dev: random.uniform(-1.0, 1.0) for dev in DEVICES}

# Starting weights per hive (kg) — realistic beehive range 10–30 kg
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


# ── Data generator ───────────────────────────────────────────────────────

def update_weight(dev_eui: str, step: int) -> float:
    """
    Weight drifts slowly upward during nectar season (production) and can drop
    sharply if a harvest simulation is triggered. Returns the updated weight.
    """
    w = device_weights[dev_eui]
    # Slow daily production: +0.05–0.20 kg per 15-min slot
    w += random.uniform(0.02, 0.20)
    # Rare harvest event (~1% chance): sudden drop of 2–8 kg
    if random.random() < 0.01:
        w = max(8.0, w - random.uniform(2.0, 8.0))
    # Keep within realistic bounds
    w = max(8.0, min(60.0, w))
    device_weights[dev_eui] = w
    return round(w, 3)


def generate_measurement(dev_eui: str, step: int, lat: float, lng: float, offset: float) -> dict:
    alert_mode = random.random() < 0.15   # ~15 % chance

    temp = (
        random.uniform(36.0, 42.0)
        if alert_mode
        else 33.5 + offset + random.uniform(-1.5, 1.5)
    )
    hum = (
        random.uniform(71.0, 85.0)
        if alert_mode
        else 62.0 + offset + random.uniform(-6.0, 6.0)
    )
    sound    = max(10, min(100, int(
        random.uniform(75, 95) if alert_mode else 40 + random.uniform(-20, 20)
    )))
    door_open = random.random() < 0.05
    weight_kg = update_weight(dev_eui, step)
    batt      = 3.95 - min(0.5, step * 0.0005) + random.uniform(-0.01, 0.01)

    lat_j = lat + random.uniform(-0.0002, 0.0002)
    lng_j = lng + random.uniform(-0.0002, 0.0002)

    return {
        "temperature_c": round(temp, 2),
        "humidity_pct" : round(hum, 2),
        "sound_level"  : sound,
        "door_open"    : door_open,
        "weight_kg"    : weight_kg,
        "gps_lat"      : round(lat_j, 6),
        "gps_lng"      : round(lng_j, 6),
        "battery_v"    : round(batt, 3),
    }


def build_payload(dev_eui: str, step: int, lat: float, lng: float, offset: float) -> dict:
    return {
        "devEui": dev_eui,
        "time"  : datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "rxInfo": [{
            "rssi": random.randint(-95, -45),
            "snr" : round(random.uniform(4.0, 11.0), 1),
        }],
        "object": generate_measurement(dev_eui, step, lat, lng, offset),
    }


# ── Main loop ────────────────────────────────────────────────────────────

def main() -> None:
    print("🐝 Multi-hive simulator started")
    print(f"→ Webhook : {WEBHOOK_URL}")
    print(f"→ Devices : {len(DEVICES)}")
    print(f"→ Interval: {INTERVAL_SECONDS}s  ({INTERVAL_SECONDS // 60} min)\n")

    while True:
        for dev_eui in DEVICES:
            step   = device_steps[dev_eui]
            lat, lng = DEVICE_LOCATIONS[dev_eui]
            offset = device_offsets[dev_eui]
            payload = build_payload(dev_eui, step, lat, lng, offset)

            try:
                status, _ = post_json(WEBHOOK_URL, payload)
                obj = payload["object"]
                print(
                    f"[{dev_eui}] step={step:04d} "
                    f"T={obj['temperature_c']}°C  H={obj['humidity_pct']}%  "
                    f"W={obj['weight_kg']}kg  status={status}"
                )
            except Exception as exc:
                print(f"[{dev_eui}] step={step:04d} error={exc}")

            device_steps[dev_eui] += 1

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()