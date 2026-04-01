#!/usr/bin/env python3
import json
import random
import time
from datetime import datetime, timezone
from urllib import request


WEBHOOK_URL = "http://localhost:8000/webhooks/chirpstack/uplink"
DEV_EUI = "70b3d57ed0064a12"
INTERVAL_SECONDS = 10


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


def generate_measurement(step: int) -> dict:
    # Simulate realistic hive behavior around baseline values.
    temp = 33.5 + random.uniform(-1.5, 1.5)
    hum = 62.0 + random.uniform(-6.0, 6.0)
    sound = max(10, min(90, int(40 + random.uniform(-20, 20))))
    door_open = random.random() < 0.05  # mostly closed
    batt = 3.95 - min(0.5, step * 0.0005) + random.uniform(-0.01, 0.01)
    lat = 35.6895 + random.uniform(-0.0003, 0.0003)
    lng = -0.6417 + random.uniform(-0.0003, 0.0003)

    return {
        "temperature_c": round(temp, 2),
        "humidity_pct": round(hum, 2),
        "sound_level": sound,
        "door_open": door_open,
        "gps_lat": round(lat, 6),
        "gps_lng": round(lng, 6),
        "battery_v": round(batt, 3),
    }


def main() -> None:
    print(f"Simulating uplinks to {WEBHOOK_URL}")
    print(f"DevEUI: {DEV_EUI}, interval: {INTERVAL_SECONDS}s")

    step = 0
    while True:
        payload = {
            "devEui": DEV_EUI,
            "time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "rxInfo": [{"rssi": random.randint(-95, -45), "snr": round(random.uniform(4.0, 11.0), 1)}],
            "object": generate_measurement(step),
        }
        try:
            status, body = post_json(WEBHOOK_URL, payload)
            print(f"[{step:04d}] status={status} body={body}")
        except Exception as exc:
            print(f"[{step:04d}] error={exc}")
        step += 1
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()

