#!/usr/bin/env python3
"""
tools/simulate_uplink.py  —  IBEE calibrated multi-hive simulator
══════════════════════════════════════════════════════════════════

Calibration sources
───────────────────
  temperature_c  : IBEE real data (210 Railway rows, brood-area sensor)
                   mean=34.3°C, confirmed brood-area placement (32–42°C)
  humidity_pct   : IBEE real data (mean=64.6%) — NOT HOBOS (75.8% is
                   outer-frame placement, different sensor position)
  weight_kg      : IBEE real data (mean=18.4 kg) — NOT HOBOS (54 kg
                   Langstroth+super; IBEE hives are lighter Warré-style)
  weight_delta   : HOBOS (2.7M rows) — excellent event ratios:
                   normal_std=0.027 kg/reading, swarm_drop=−0.11 kg
  sound_level    : IBEE real data (0–100 normalized, mean=48, KY-037)
  door_open      : IBEE real data (4.8% true rate)
  battery_v      : IBEE real data (3.936–3.960V fresh deployment)
  seasonal swing : HOBOS seasonal std patterns scaled to IBEE ranges

Hive states simulated
─────────────────────
  normal          — healthy active colony, day/night temperature cycle
  swarming_risk   — pre-swarm: overcrowded, hotter, louder, heavier
  robbing         — attack: chaotic sound, frantic door, weight drops fast
  winter_cluster  — cold season: quiet, low activity, slow weight loss
  empty           — no colony: temp follows ambient, near-silence

Usage
─────
  # Send to production (Railway)
  python simulate_uplink.py

  # Send to local backend
  WEBHOOK_URL=http://localhost:8000 python simulate_uplink.py

  # Fast mode for testing (every 5 seconds)
  INTERVAL=5 python simulate_uplink.py

  # Generate CSV training dataset only (no HTTP)
  python simulate_uplink.py --generate-dataset
"""

from __future__ import annotations

import argparse
import json
import os
import random
import time
from collections import deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib import request

import numpy as np

# ── reproducibility ───────────────────────────────────────────────────────────
SEED = 42
rng  = np.random.default_rng(SEED)

# ── HTTP config ───────────────────────────────────────────────────────────────
BACKEND_URL      = os.getenv("WEBHOOK_URL", "https://ibee-backend-production.up.railway.app")
WEBHOOK_URL      = f"{BACKEND_URL}/webhooks/chirpstack/uplink"
INTERVAL_SECONDS = int(os.getenv("INTERVAL", str(15 * 60)))  # 15 min default

# ── Devices (unchanged from original) ─────────────────────────────────────────
DEVICES = [
    "70b3d57ed0064a12", "70b3d57ed0064a13", "70b3d57ed0064a14",
    "70b3d57ed0064a15", "70b3d57ed0064a16", "70b3d57ed0064a17",
    "70b3d57ed0064a18", "70b3d57ed0064a19", "70b3d57ed0064a20",
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

# ══════════════════════════════════════════════════════════════════════════════
# CALIBRATED SENSOR PROFILES
# Source: HOBOS 2.7M rows (weight_delta ratios) + IBEE 210 Railway rows
# ══════════════════════════════════════════════════════════════════════════════

# Normal state baseline — from IBEE real data
NORMAL = {
    "temp_mean"   : 34.3,   # °C  brood area (IBEE real mean)
    "temp_std"    : 2.4,    # °C  (IBEE real std)
    "temp_night_drop": 1.5, # °C  cooler at night (HOBOS daily cycle)
    "hum_mean"    : 64.6,   # %   (IBEE real mean)
    "hum_std"     : 7.0,    # %   (IBEE real std)
    "sound_mean"  : 48.0,   # 0-100 (IBEE real mean, KY-037 normalized)
    "sound_std"   : 15.0,   # (IBEE real std estimate)
    "door_open_p" : 0.048,  # probability (IBEE real: 4.8%)
    "weight_base" : 18.4,   # kg  (IBEE real mean)
    "weight_std"  : 0.027,  # kg/reading — normal drift (HOBOS normal_std)
    "battery_start": 3.955, # V  (IBEE real mean)
    "battery_drain": 0.0005,# V/reading — slow drain
}

# State-specific deltas — calibrated from HOBOS event ratios
# scaled to IBEE's lighter hive weight
WEIGHT_SCALE = 18.4 / 54.5   # IBEE/HOBOS weight ratio ≈ 0.34

STATE_PROFILES = {
    "normal": {
        "temp_offset"  : 0.0,
        "temp_extra_std": 0.0,
        "hum_offset"   : 0.0,
        "sound_mean"   : 48.0,
        "sound_std"    : 15.0,
        "door_open_p"  : 0.048,
        "weight_drift" : 0.0,          # kg/reading net drift
        "weight_event_std": 0.027,     # HOBOS normal_std
        "label"        : "normal",
    },
    "swarming_risk": {
        # Pre-swarm: overcrowded → hotter, higher humidity,
        # louder, heavy traffic, weight plateau then slight drop
        "temp_offset"  : +3.5,         # bees generate more heat
        "temp_extra_std": 1.5,
        "hum_offset"   : +12.0,        # more bees = more moisture
        "sound_mean"   : 72.0,         # louder (vs 48 normal)
        "sound_std"    : 14.0,
        "door_open_p"  : 0.20,         # heavy traffic
        "weight_drift" : +0.010,       # colony growing (nectar stored)
        "weight_event_std": 0.035,
        "label"        : "swarming_risk",
    },
    "robbing": {
        # Foreign bees attacking: chaotic sound spikes,
        # frantic door events, rapid weight loss (honey stolen)
        # HOBOS robbing_p1 = -0.064 kg/hr, scaled to IBEE: -0.064×0.34
        "temp_offset"  : +1.5,
        "temp_extra_std": 3.0,         # erratic — fighting bees
        "hum_offset"   : -5.0,         # more ventilation
        "sound_mean"   : 85.0,         # very loud + erratic
        "sound_std"    : 12.0,
        "door_open_p"  : 0.55,         # chaotic entry/exit
        "weight_drift" : -0.064 * WEIGHT_SCALE,   # -0.022 kg/reading
        "weight_event_std": 0.050,
        "label"        : "robbing",
    },
    "winter_cluster": {
        # Bees cluster for warmth: lower activity,
        # quiet, temperature drops slightly, slow weight loss
        "temp_offset"  : -4.0,         # cluster less effective vs summer
        "temp_extra_std": 0.5,
        "hum_offset"   : -15.0,        # drier in winter cluster
        "sound_mean"   : 12.0,         # near silence
        "sound_std"    : 6.0,
        "door_open_p"  : 0.005,        # almost no exits
        "weight_drift" : -0.003,       # slow honey consumption
        "weight_event_std": 0.010,
        "label"        : "winter_cluster",
    },
    "empty": {
        # No colony: temp = ambient, silence
        "temp_offset"  : -15.0,        # follows ambient, no bee heat
        "temp_extra_std": 0.3,
        "hum_offset"   : +8.0,         # follows ambient humidity
        "sound_mean"   : 5.0,
        "sound_std"    : 4.0,
        "door_open_p"  : 0.001,
        "weight_drift" : 0.0,
        "weight_event_std": 0.002,
        "label"        : "empty",
    },
}

# ── Scenario: each device cycles through a realistic state sequence ───────────
# Duration in number of readings (at 15 min interval: 96 readings = 1 day)
READINGS_PER_DAY = 96   # 24h × 4 readings/hr at 15-min interval

DEVICE_SCENARIOS: dict[str, list[tuple[str, int]]] = {}
for i, dev in enumerate(DEVICES):
    # Stagger scenarios so not all devices alarm at once
    offset = i * (READINGS_PER_DAY // len(DEVICES))
    DEVICE_SCENARIOS[dev] = [
        ("normal",         READINGS_PER_DAY * 5 + offset),
        ("swarming_risk",  READINGS_PER_DAY * 2),
        ("normal",         READINGS_PER_DAY * 3),
        ("robbing",        READINGS_PER_DAY // 2),
        ("normal",         READINGS_PER_DAY * 4),
        ("winter_cluster", READINGS_PER_DAY * 3),
        ("normal",         READINGS_PER_DAY * 2),
    ]

# ── Per-device runtime state ──────────────────────────────────────────────────
device_steps        = {dev: 0 for dev in DEVICES}
device_weights      = {dev: NORMAL["weight_base"] + rng.uniform(-3.0, 3.0)
                       for dev in DEVICES}
device_batteries    = {dev: NORMAL["battery_start"] for dev in DEVICES}
device_scenario_pos = {dev: 0 for dev in DEVICES}   # index into scenario list
device_scenario_cnt = {dev: 0 for dev in DEVICES}   # readings in current state


# ── State machine ─────────────────────────────────────────────────────────────
def get_current_state(dev_eui: str) -> str:
    """Return current hive state label, advancing the scenario when due."""
    scenario = DEVICE_SCENARIOS[dev_eui]
    pos      = device_scenario_pos[dev_eui]
    cnt      = device_scenario_cnt[dev_eui]
    state, duration = scenario[pos % len(scenario)]

    if cnt >= duration:
        device_scenario_pos[dev_eui] = (pos + 1) % len(scenario)
        device_scenario_cnt[dev_eui] = 0
        state = DEVICE_SCENARIOS[dev_eui][device_scenario_pos[dev_eui] % len(scenario)][0]
    else:
        device_scenario_cnt[dev_eui] += 1

    return state


# ── Ambient temperature — realistic daily cycle ───────────────────────────────
def ambient_temp(ts: datetime) -> float:
    """Oujda/Morocco climate: hot summers, mild winters. Peak at 15:00."""
    hour        = ts.hour
    month       = ts.month
    # Annual: 15°C Jan → 35°C Jul baseline
    annual_base = 25.0 + 10.0 * np.sin(2 * np.pi * (month - 4) / 12)
    # Daily swing: ±7°C, peak at 15h
    daily_swing = 7.0 * np.sin(2 * np.pi * (hour - 3) / 24)
    noise       = rng.normal(0, 0.8)
    return round(float(annual_base + daily_swing + noise), 2)


# ── Sensor generation ─────────────────────────────────────────────────────────
def generate_measurement(
    dev_eui: str, step: int, lat: float, lng: float, ts: datetime
) -> dict:
    state   = get_current_state(dev_eui)
    profile = STATE_PROFILES[state]
    amb     = ambient_temp(ts)

    # ── Temperature ───────────────────────────────────────────────────────────
    # Brood area is always warmer than ambient; offset depends on state
    base_temp  = NORMAL["temp_mean"] + profile["temp_offset"]
    temp_noise = rng.normal(0, NORMAL["temp_std"] + profile["temp_extra_std"])
    # Night cooling: bees regulate less aggressively at night
    night_adj  = -NORMAL["temp_night_drop"] if ts.hour < 7 or ts.hour > 21 else 0.0
    temperature = float(np.clip(base_temp + temp_noise + night_adj, 28.0, 50.0))

    # ── Humidity ──────────────────────────────────────────────────────────────
    hum_base  = NORMAL["hum_mean"] + profile["hum_offset"]
    humidity  = float(np.clip(rng.normal(hum_base, NORMAL["hum_std"]), 30.0, 98.0))

    # ── Sound ─────────────────────────────────────────────────────────────────
    sound_raw = rng.normal(profile["sound_mean"], profile["sound_std"])
    # Daytime activity boost
    if 8 <= ts.hour <= 18:
        sound_raw += 8.0
    sound = int(np.clip(sound_raw, 0, 100))

    # ── Door open ─────────────────────────────────────────────────────────────
    # More activity during day, none at night in normal state
    door_p = profile["door_open_p"]
    if ts.hour < 6 or ts.hour > 20:
        door_p *= 0.1   # almost no exits at night
    door_open = bool(rng.random() < door_p)

    # ── Weight ────────────────────────────────────────────────────────────────
    w = device_weights[dev_eui]
    w += rng.normal(profile["weight_drift"], profile["weight_event_std"])
    # Occasional large event (swarm drop / harvest)
    if state == "swarming_risk" and rng.random() < 0.002:
        w -= abs(rng.normal(0.112 * WEIGHT_SCALE, 0.02))   # swarm departure
    if state == "robbing" and rng.random() < 0.05:
        w -= abs(rng.normal(0.05,  0.01))                   # honey theft burst
    w = float(np.clip(w, 5.0, 40.0))
    device_weights[dev_eui] = w

    # ── Battery ───────────────────────────────────────────────────────────────
    batt = device_batteries[dev_eui]
    batt -= NORMAL["battery_drain"] + rng.uniform(0, 0.0001)
    batt = max(3.2, batt)
    device_batteries[dev_eui] = batt

    # ── GPS (static + small jitter) ───────────────────────────────────────────
    gps_lat = round(lat + float(rng.normal(0, 0.00001)), 6)
    gps_lng = round(lng + float(rng.normal(0, 0.00001)), 6)

    # ── Signal ────────────────────────────────────────────────────────────────
    rssi = random.randint(-95, -45)
    snr  = round(random.uniform(4.0, 11.0), 1)

    return {
        "temperature_c": round(temperature, 2),
        "humidity_pct" : round(humidity,    2),
        "sound_level"  : sound,
        "door_open"    : door_open,
        "weight_kg"    : round(w, 3),
        "gps_lat"      : gps_lat,
        "gps_lng"      : gps_lng,
        "battery_v"    : round(batt, 3),
        # Extra field for dataset generation (stripped before webhook send)
        "_hive_state"  : state,
    }


# ── Webhook payload builder ───────────────────────────────────────────────────
def build_payload(dev_eui: str, measurement: dict, ts: datetime) -> dict:
    obj = {k: v for k, v in measurement.items() if not k.startswith("_")}
    return {
        "devEui": dev_eui,
        "time"  : ts.isoformat().replace("+00:00", "Z"),
        "rxInfo": [{"rssi": obj.get("rssi", -70), "snr": obj.get("snr", 7.0)}],
        "object": obj,
    }


# ── HTTP helper ───────────────────────────────────────────────────────────────
def post_json(url: str, payload: dict) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req  = request.Request(
        url=url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode("utf-8")


# ── Dataset generation mode ───────────────────────────────────────────────────
def generate_dataset(n_days: int = 30, output_path: str = "data/processed/simulated_dataset.csv") -> None:
    """
    Generate a labeled CSV dataset for ML training.
    One row per device per 15-min interval for n_days.
    Includes hive_state label column.
    """
    import pandas as pd

    print(f"Generating {n_days}-day labeled dataset...")
    rows = []
    base_time = datetime(2024, 9, 1, 0, 0, 0, tzinfo=timezone.utc)
    readings_total = n_days * READINGS_PER_DAY

    for dev in DEVICES:
        # Reset state for clean generation
        device_steps[dev]        = 0
        device_weights[dev]      = NORMAL["weight_base"] + rng.uniform(-3.0, 3.0)
        device_batteries[dev]    = NORMAL["battery_start"]
        device_scenario_pos[dev] = 0
        device_scenario_cnt[dev] = 0

        lat, lng = DEVICE_LOCATIONS[dev]

        for i in range(readings_total):
            ts          = base_time + timedelta(minutes=15 * i)
            measurement = generate_measurement(dev, i, lat, lng, ts)
            row = {
                "ts"           : ts.isoformat(),
                "device_id"    : dev,
                "temperature_c": measurement["temperature_c"],
                "humidity_pct" : measurement["humidity_pct"],
                "sound_level"  : measurement["sound_level"],
                "door_open"    : measurement["door_open"],
                "weight_kg"    : measurement["weight_kg"],
                "battery_v"    : measurement["battery_v"],
                "gps_lat"      : measurement["gps_lat"],
                "gps_lng"      : measurement["gps_lng"],
                "hive_state"   : measurement["_hive_state"],
            }
            rows.append(row)

    df = pd.DataFrame(rows)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"✓ Saved {len(df):,} rows → {output_path}")
    print(f"\nState distribution:")
    dist = df.groupby("hive_state").size().reset_index(name="count")
    dist["pct"] = (dist["count"] / len(df) * 100).round(1)
    print(dist.to_string(index=False))
    print(f"\nSensor ranges:")
    for col in ["temperature_c", "humidity_pct", "sound_level", "weight_kg"]:
        print(f"  {col:<20}: mean={df[col].mean():.2f}  std={df[col].std():.2f}  "
              f"range=[{df[col].min():.2f}, {df[col].max():.2f}]")


# ── Live simulation loop ──────────────────────────────────────────────────────
def main() -> None:
    print("🐝 IBEE calibrated multi-hive simulator")
    print(f"→ Target  : {WEBHOOK_URL}")
    print(f"→ Devices : {len(DEVICES)}")
    print(f"→ Interval: {INTERVAL_SECONDS}s ({INTERVAL_SECONDS // 60} min)")
    print(f"→ Tip: set INTERVAL=5 for fast testing\n")

    while True:
        ts = datetime.now(timezone.utc)
        for dev_eui in DEVICES:
            lat, lng    = DEVICE_LOCATIONS[dev_eui]
            step        = device_steps[dev_eui]
            measurement = generate_measurement(dev_eui, step, lat, lng, ts)
            payload     = build_payload(dev_eui, measurement, ts)
            state       = measurement["_hive_state"]

            try:
                status, _ = post_json(WEBHOOK_URL, payload)
                obj = payload["object"]
                state_display = f"[{state:<15}]"
                print(
                    f"{dev_eui[-4:]} {state_display} "
                    f"T={obj['temperature_c']:5.1f}°C  "
                    f"H={obj['humidity_pct']:5.1f}%  "
                    f"S={obj['sound_level']:3d}  "
                    f"W={obj['weight_kg']:5.2f}kg  "
                    f"→ HTTP {status}"
                )
            except Exception as exc:
                print(f"[{dev_eui[-4:]}] ✗ {exc}")

            device_steps[dev_eui] += 1

        print(f"  ↻ Next batch in {INTERVAL_SECONDS}s...\n")
        time.sleep(INTERVAL_SECONDS)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IBEE hive simulator")
    parser.add_argument(
        "--generate-dataset",
        action="store_true",
        help="Generate labeled CSV training dataset and exit (no HTTP)",
    )
    parser.add_argument(
        "--days", type=int, default=30,
        help="Number of days to simulate for dataset generation (default: 30)",
    )
    parser.add_argument(
        "--output", type=str, default="data/processed/simulated_dataset.csv",
        help="Output path for generated dataset",
    )
    args = parser.parse_args()

    if args.generate_dataset:
        generate_dataset(n_days=args.days, output_path=args.output)
    else:
        main()