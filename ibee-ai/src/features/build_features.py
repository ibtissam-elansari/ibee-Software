# ibee-ai/src/features/build_features.py
"""
Feature engineering pipeline for IBEE hive sensor data.

Inputs  : data/processed/simulated_dataset.csv
Outputs : data/processed/features_dataset.parquet   (primary — fast, typed)
          data/processed/features_dataset.csv        (backup — human-readable)

Usage
─────
  python src/features/build_features.py            # run standalone
  from src.features.build_features import build    # import in notebook / trainer
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

# ── Make sure src/ is importable when run as a script ─────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from src.utils.paths import SIMULATED_CSV, FEATURES_CSV, FEATURES_PARQUET

# ── Rolling window sizes (in readings; 1 reading = 15 min) ───────────────────
WIN_1H  = 4    #  1 hour
WIN_3H  = 12   #  3 hours
WIN_6H  = 24   #  6 hours
WIN_24H = 96   # 24 hours


# ══════════════════════════════════════════════════════════════════════════════
# SANITY CHECK
# ══════════════════════════════════════════════════════════════════════════════

def sanity_check(df: pd.DataFrame) -> None:
    """
    Lightweight validation of the simulated dataset.
    Prints a structured report and raises if anything is critically wrong.
    """
    SEP = "─" * 60
    print(f"\n{'═'*60}")
    print("  IBEE SIMULATED DATASET — SANITY CHECK")
    print(f"{'═'*60}")

    # ── Shape & types ─────────────────────────────────────────────────────────
    print(f"\n{SEP}")
    print(f"  Shape        : {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"  Date range   : {df['ts'].min()}  →  {df['ts'].max()}")
    print(f"  Devices      : {df['device_id'].nunique()}  "
          f"({df['device_id'].nunique()} expected)")

    # ── Missing values ────────────────────────────────────────────────────────
    print(f"\n{SEP}")
    nulls = df.isnull().sum()
    null_cols = nulls[nulls > 0]
    if null_cols.empty:
        print("  ✓ No missing values")
    else:
        print(f"  ✗ Missing values detected:\n{null_cols}")

    # ── State distribution ────────────────────────────────────────────────────
    print(f"\n{SEP}")
    print("  Hive state distribution:")
    dist = df["hive_state"].value_counts()
    pct  = (dist / len(df) * 100).round(1)
    for state, cnt in dist.items():
        bar = "█" * int(pct[state] / 2)
        print(f"    {state:<20} {cnt:>8,}  ({pct[state]:5.1f}%)  {bar}")

    # ── Sensor range checks (calibrated bounds from simulate_uplink.py) ───────
    print(f"\n{SEP}")
    print("  Sensor range validation (hard bounds from simulator):")

    BOUNDS = {
        "temperature_c": (28.0,  50.0),
        "humidity_pct" : (30.0,  98.0),
        "sound_level"  : ( 0,   100),
        "weight_kg"    : ( 5.0,  40.0),
        "battery_v"    : ( 3.2,   4.0),
    }
    all_ok = True
    for col, (lo, hi) in BOUNDS.items():
        out = df[(df[col] < lo) | (df[col] > hi)]
        status = "✓" if out.empty else f"✗  {len(out):,} rows out of bounds"
        print(f"    {col:<20} [{lo:.1f} – {hi:.1f}]   {status}")
        if not out.empty:
            all_ok = False

    # ── Per-state sensor means (spot-check vs calibration) ───────────────────
    print(f"\n{SEP}")
    print("  Per-state sensor means (spot-check):")
    means = (
        df.groupby("hive_state")[["temperature_c", "humidity_pct",
                                   "sound_level", "weight_kg"]]
          .mean()
          .round(2)
    )
    print(means.to_string())

    # ── Weight drift direction per state ──────────────────────────────────────
    print(f"\n{SEP}")
    print("  Weight drift direction per state (first→last mean, per device):")
    half = len(df) // 2
    for state in df["hive_state"].unique():
        sub = df[df["hive_state"] == state]["weight_kg"]
        if len(sub) < 2:
            continue
        direction = "↑" if sub.iloc[-len(sub)//2:].mean() > sub.iloc[:len(sub)//2].mean() else "↓"
        print(f"    {state:<20}  {direction}")

    # ── Timeline continuity (no gaps) ────────────────────────────────────────
    print(f"\n{SEP}")
    print("  Timeline gap check (expected 15-min intervals):")
    for dev, grp in df.groupby("device_id"):
        diffs = grp["ts"].diff().dropna()
        bad = diffs[diffs != pd.Timedelta("15min")]
        if bad.empty:
            print(f"    {dev[-4:]}  ✓")
        else:
            print(f"    {dev[-4:]}  ✗  {len(bad)} irregular gaps")

    print(f"\n{'═'*60}")
    if not all_ok:
        raise ValueError("Sanity check failed: sensor values out of calibrated bounds.")
    print("  ✓ All checks passed — safe to proceed with feature engineering")
    print(f"{'═'*60}\n")


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════════

def build(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full feature engineering pipeline. Returns enriched DataFrame.

    Feature groups
    ──────────────
    1. Time / cyclical        — hour, day, month encoded as sin/cos
    2. Rolling statistics     — mean, std, min, max over 1h/3h/6h/24h windows
    3. Rate of change         — diff and pct_change for key sensors
    4. Cross-sensor           — interaction terms that distinguish states
    5. Weight event flags     — swarm drop, robbing burst, nectar flow
    6. Hive activity score    — composite of sound + door + temp
    7. Target encoding        — label → integer for ML
    """
    df = df.copy()
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.sort_values(["device_id", "ts"]).reset_index(drop=True)

    print("Building features…")

    # ── 1. Time / cyclical encodings ─────────────────────────────────────────
    print("  [1/7] Time & cyclical encodings")
    df["hour"]  = df["ts"].dt.hour
    df["month"] = df["ts"].dt.month
    df["dow"]   = df["ts"].dt.dayofweek   # 0=Mon

    # Cyclical: sin/cos so 23→0 wraps smoothly
    df["hour_sin"]  = np.sin(2 * np.pi * df["hour"]  / 24)
    df["hour_cos"]  = np.cos(2 * np.pi * df["hour"]  / 24)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df["dow_sin"]   = np.sin(2 * np.pi * df["dow"]   / 7)
    df["dow_cos"]   = np.cos(2 * np.pi * df["dow"]   / 7)

    # Boolean flags
    df["is_daytime"] = ((df["hour"] >= 8) & (df["hour"] <= 18)).astype(int)
    df["is_night"]   = ((df["hour"] <  6) | (df["hour"] >  20)).astype(int)

    # ── 2. Rolling statistics (per device, respecting device boundaries) ──────
    print("  [2/7] Rolling statistics (1h / 3h / 6h / 24h)")
    ROLL_COLS = ["temperature_c", "humidity_pct", "sound_level", "weight_kg"]

    for col in ROLL_COLS:
        grp = df.groupby("device_id")[col]
        for win, label in [(WIN_1H, "1h"), (WIN_3H, "3h"),
                           (WIN_6H, "6h"), (WIN_24H, "24h")]:
            roll = grp.transform(
                lambda s, w=win: s.rolling(w, min_periods=max(1, w // 2))
            )
            df[f"{col}_roll_mean_{label}"] = roll.mean()
            df[f"{col}_roll_std_{label}"]  = roll.std().fillna(0)
            # Only keep min/max for 6h and 24h (reduce dimensionality)
            if win in (WIN_6H, WIN_24H):
                df[f"{col}_roll_min_{label}"]  = roll.min()
                df[f"{col}_roll_max_{label}"]  = roll.max()

    # ── 3. Rate of change ────────────────────────────────────────────────────
    print("  [3/7] Rate of change (diff & pct_change)")
    ROC_COLS = ["temperature_c", "sound_level", "weight_kg"]
    for col in ROC_COLS:
        grp = df.groupby("device_id")[col]
        df[f"{col}_diff1"]     = grp.transform(lambda s: s.diff(1)).fillna(0)
        df[f"{col}_diff4"]     = grp.transform(lambda s: s.diff(4)).fillna(0)   # 1h
        df[f"{col}_diff96"]    = grp.transform(lambda s: s.diff(96)).fillna(0)  # 24h
        df[f"{col}_pct_1h"]    = grp.transform(
            lambda s: s.pct_change(4).replace([np.inf, -np.inf], 0)
        ).fillna(0)

    # ── 4. Cross-sensor interactions ─────────────────────────────────────────
    print("  [4/7] Cross-sensor interactions")

    # Swarming signature: high temp AND high sound AND high humidity
    df["temp_x_sound"]   = df["temperature_c"] * df["sound_level"] / 100
    df["temp_x_hum"]     = df["temperature_c"] * df["humidity_pct"] / 100
    df["sound_x_door"]   = df["sound_level"]   * df["door_open"].astype(int)

    # Temperature deviation from brood-area normal (34.3°C)
    df["temp_dev_normal"]  = df["temperature_c"] - 34.3

    # Rolling sound volatility (std over 1h) — robbing has erratic sound
    df["sound_volatility_1h"] = (
        df.groupby("device_id")["sound_level"]
          .transform(lambda s: s.rolling(WIN_1H, min_periods=2).std())
          .fillna(0)
    )

    # Weight vs 24h rolling mean — deviation signals events
    df["weight_dev_24h"] = df["weight_kg"] - df["weight_kg_roll_mean_24h"]

    # ── 5. Weight event flags ─────────────────────────────────────────────────
    print("  [5/7] Weight event flags")

    # Swarm drop: sudden weight loss > 0.04 kg in one reading (HOBOS-calibrated)
    df["flag_swarm_drop"]   = (df["weight_kg_diff1"] < -0.040).astype(int)

    # Robbing burst: sustained weight loss + high sound
    df["flag_robbing"]      = (
        (df["weight_kg_diff4"] < -0.015) &   # losing >15g/hr
        (df["sound_level"]     >  70)
    ).astype(int)

    # Nectar flow: sustained weight gain + daytime + moderate sound
    df["flag_nectar_flow"]  = (
        (df["weight_kg_diff4"] >  0.010) &
        (df["is_daytime"]      == 1) &
        (df["sound_level"]     >  35)
    ).astype(int)

    # Overweight plateau (swarming risk precursor)
    df["flag_heavy_trend"]  = (
        (df["weight_kg_roll_mean_24h"] > 25.0) &
        (df["weight_kg_diff96"] > 1.5)
    ).astype(int)

    # ── 6. Hive activity composite score (0–100) ──────────────────────────────
    print("  [6/7] Composite hive activity score")
    # Normalize each component to [0,1] using calibrated ranges
    temp_norm  = (df["temperature_c"] - 28.0) / (50.0 - 28.0)
    sound_norm = df["sound_level"] / 100.0
    door_norm  = df["door_open"].astype(float)

    df["activity_score"] = np.clip(
        (0.40 * sound_norm + 0.35 * door_norm + 0.25 * temp_norm) * 100,
        0, 100
    ).round(1)

    # ── 7. Target encoding ───────────────────────────────────────────────────
    print("  [7/7] Target label encoding")
    STATE_MAP = {
        "normal"         : 0,
        "swarming_risk"  : 1,
        "robbing"        : 2,
        "winter_cluster" : 3,
        "empty"          : 4,
    }
    df["label"] = df["hive_state"].map(STATE_MAP)

    print(f"  ✓ Feature engineering complete — {df.shape[1]} total columns\n")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    print(f"Reading  : {SIMULATED_CSV}")
    df_raw = pd.read_csv(SIMULATED_CSV, parse_dates=["ts"])
    print(f"Loaded   : {df_raw.shape[0]:,} rows × {df_raw.shape[1]} columns\n")

    # ── Sanity check ─────────────────────────────────────────────────────────
    sanity_check(df_raw)

    # ── Feature engineering ───────────────────────────────────────────────────
    df_feat = build(df_raw)

    # ── Save outputs ──────────────────────────────────────────────────────────
    df_feat.to_parquet(FEATURES_PARQUET, index=False)
    df_feat.to_csv(FEATURES_CSV, index=False)

    print(f"Saved  → {FEATURES_PARQUET}  ({FEATURES_PARQUET.stat().st_size / 1e6:.1f} MB)")
    print(f"Saved  → {FEATURES_CSV}  ({FEATURES_CSV.stat().st_size / 1e6:.1f} MB)")
    print(f"\nFinal shape: {df_feat.shape[0]:,} rows × {df_feat.shape[1]} columns")

    # ── Quick feature summary ─────────────────────────────────────────────────
    print("\nNew feature columns:")
    raw_cols = set(df_raw.columns)
    for col in df_feat.columns:
        if col not in raw_cols:
            print(f"  {col}")


if __name__ == "__main__":
    main()