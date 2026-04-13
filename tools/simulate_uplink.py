#!/usr/bin/env python3
import json
import random
import time
from datetime import datetime, timezone
from urllib import request

# ── Config ───────────────────────────────────────────────────────────────

WEBHOOK_URL = "http://localhost:8000/webhooks/chirpstack/uplink"
INTERVAL_SECONDS = 10

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

# Fixed GPS positions per hive
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

# Each hive has its own step counter (battery decay, etc.)
device_steps = {dev: 0 for dev in DEVICES}

# Small variation per hive (so they don’t look identical)
device_offsets = {
    dev: random.uniform(-1.0, 1.0) for dev in DEVICES
}


# ── HTTP helper ──────────────────────────────────────────────────────────

def post_json(url: str, payload: dict) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode("utf-8")


# ── Data generator ───────────────────────────────────────────────────────

def generate_measurement(step: int, lat: float, lng: float, offset: float) -> dict:
    temp = 33.5 + offset + random.uniform(-1.5, 1.5)
    hum = 62.0 + offset + random.uniform(-6.0, 6.0)
    sound = max(10, min(90, int(40 + random.uniform(-20, 20))))
    door_open = random.random() < 0.05

    # battery slowly decreases per device
    batt = 3.95 - min(0.5, step * 0.0005) + random.uniform(-0.01, 0.01)

    # small GPS jitter
    lat_jitter = lat + random.uniform(-0.0002, 0.0002)
    lng_jitter = lng + random.uniform(-0.0002, 0.0002)

    return {
        "temperature_c": round(temp, 2),
        "humidity_pct": round(hum, 2),
        "sound_level": sound,
        "door_open": door_open,
        "gps_lat": round(lat_jitter, 6),
        "gps_lng": round(lng_jitter, 6),
        "battery_v": round(batt, 3),
    }


# ── Main loop ────────────────────────────────────────────────────────────

def main() -> None:
    print(f"🚀 Multi-hive simulator started")
    print(f"→ Webhook: {WEBHOOK_URL}")
    print(f"→ Devices: {len(DEVICES)}")
    print(f"→ Interval: {INTERVAL_SECONDS}s\n")

    while True:
        for dev_eui in DEVICES:
            step = device_steps[dev_eui]
            lat, lng = DEVICE_LOCATIONS[dev_eui]
            offset = device_offsets[dev_eui]

            payload = {
                "devEui": dev_eui,
                "time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "rxInfo": [{
                    "rssi": random.randint(-95, -45),
                    "snr": round(random.uniform(4.0, 11.0), 1),
                }],
                "object": generate_measurement(step, lat, lng, offset),
            }

            try:
                status, _ = post_json(WEBHOOK_URL, payload)
                print(f"[{dev_eui}] step={step:04d} status={status}")
            except Exception as exc:
                print(f"[{dev_eui}] step={step:04d} error={exc}")

            device_steps[dev_eui] += 1

        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()