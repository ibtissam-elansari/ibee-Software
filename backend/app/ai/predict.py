"""
backend/app/ai/predict.py
─────────────────────────────────────────────────────────────────────────────
IBEE production inference module.

Loads both models once at startup, maintains a per-device rolling buffer,
and exposes a single function:

    result: PredictResult = predict(dev_eui, decoded_payload)

Called from routes_webhooks.py after decoding, before persisting.
"""

from __future__ import annotations

import json
import logging
import pickle
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Paths (relative to this file) ────────────────────────────────────────────
_AI_DIR   = Path(__file__).parent
_ISO_PATH = _AI_DIR / "isolation_forest.pkl"
_CLF_PATH = _AI_DIR / "classifier.pkl"
_THR_PATH = _AI_DIR / "anomaly_threshold.json"
_META_PATH= _AI_DIR / "features_meta.json"

# Override via env vars on Railway
import os
_ISO_PATH  = Path(os.getenv("IBEE_ISO_PATH",  str(_ISO_PATH)))
_CLF_PATH  = Path(os.getenv("IBEE_CLF_PATH",  str(_CLF_PATH)))
_THR_PATH  = Path(os.getenv("IBEE_THR_PATH",  str(_THR_PATH)))
_META_PATH = Path(os.getenv("IBEE_META_PATH", str(_META_PATH)))

# ── State metadata ────────────────────────────────────────────────────────────
STATE_META = {
    "normal":         {"label_fr": "Normal",              "color": "green",  "severity": 0, "alert": False},
    "swarming_risk":  {"label_fr": "Risque d'essaimage",  "color": "amber",  "severity": 2, "alert": True},
    "robbing":        {"label_fr": "Pillage détecté",      "color": "red",    "severity": 3, "alert": True},
    "winter_cluster": {"label_fr": "Cluster hivernal",    "color": "blue",   "severity": 1, "alert": False},
    "empty":          {"label_fr": "Ruche vide",           "color": "gray",   "severity": 3, "alert": True},
}

# ── Result dataclass ──────────────────────────────────────────────────────────
@dataclass
class PredictResult:
    label:        str
    confidence:   float
    label_fr:     str
    color:        str
    severity:     int
    should_alert: bool
    anomaly_score: float
    is_anomaly:   bool
    all_proba:    dict[str, float] = field(default_factory=dict)
    error:        Optional[str]    = None


# ── Singleton model state ─────────────────────────────────────────────────────
_iso_bundle  = None   # {"isolation_forest": ..., "scaler": ..., "features": ..., "threshold": ...}
_clf_bundle  = None   # {"model": ..., "features": ..., "classes": ...}
_threshold   = None   # float — anomaly_score threshold from anomaly_threshold.json
_features    = None   # list[str] — from features_meta.json (classifier features)
_lock        = Lock()

# Per-device rolling buffer — last 4 readings (= 1 hour at 15-min interval)
BUFFER_SIZE = 4
_buffers: dict[str, deque] = {}
_buf_lock = Lock()


def _load_models() -> None:
    global _iso_bundle, _clf_bundle, _threshold, _features
    with _lock:
        if _iso_bundle is not None:
            return

        # Load Isolation Forest bundle
        if not _ISO_PATH.exists():
            raise FileNotFoundError(f"Isolation Forest not found: {_ISO_PATH}")
        with open(_ISO_PATH, "rb") as f:
            _iso_bundle = pickle.load(f)

        # Load Classifier bundle
        if not _CLF_PATH.exists():
            raise FileNotFoundError(f"Classifier not found: {_CLF_PATH}")
        with open(_CLF_PATH, "rb") as f:
            _clf_bundle = pickle.load(f)

        # Load anomaly threshold
        if _THR_PATH.exists():
            thr = json.loads(_THR_PATH.read_text())
            _threshold = float(thr.get("anomaly_score_threshold", -0.043))
        else:
            _threshold = -0.043  # fallback from notebook 03

        # Load feature list
        if _META_PATH.exists():
            meta = json.loads(_META_PATH.read_text())
            _features = meta.get("classifier_features", meta.get("features", []))
        else:
            _features = _clf_bundle.get("features", [])

        logger.info(
            "IBEE models loaded — IF features=%d  CLF features=%d  classes=%s  threshold=%.4f",
            len(_iso_bundle.get("features", [])),
            len(_features),
            _clf_bundle.get("classes", []),
            _threshold,
        )


def _get_buffer(dev_eui: str) -> deque:
    with _buf_lock:
        if dev_eui not in _buffers:
            _buffers[dev_eui] = deque(maxlen=BUFFER_SIZE)
        return _buffers[dev_eui]


# ── Feature engineering (mirrors notebooks 02 + 03) ─────────────────────────
def _build_features(decoded: dict, buffer: deque, ts: datetime) -> pd.DataFrame:
    """
    Compute all 28 model features from a single decoded reading + rolling buffer.
    Buffer holds the last BUFFER_SIZE readings for this device.
    """
    temp   = float(decoded.get("temperature_c") or 0.0)
    hum    = float(decoded.get("humidity_pct")  or 0.0)
    sound  = float(decoded.get("sound_level")   or 0)
    door   = int(bool(decoded.get("door_open",  False)))
    weight = float(decoded.get("weight_kg")     or 0.0)
    batt   = float(decoded.get("battery_v")     or 3.9)

    buf_list = list(buffer)  # oldest → newest

    def _series(key: str, default: float) -> list[float]:
        return [float(r.get(key) or default) for r in buf_list] + [
            float(decoded.get(key) or default)]

    temps   = _series("temperature_c", temp)
    hums    = _series("humidity_pct",  hum)
    sounds  = _series("sound_level",   sound)
    doors   = _series("door_open",     0.0)
    weights = _series("weight_kg",     weight)

    def _roll_mean(lst): return float(np.mean(lst))
    def _roll_std(lst):  return float(np.std(lst))

    # Rolling stats
    t_rm  = _roll_mean(temps);    t_rs  = _roll_std(temps)
    h_rm  = _roll_mean(hums);     h_rs  = _roll_std(hums)
    s_rm  = _roll_mean(sounds);   s_rs  = _roll_std(sounds)
    w_rm  = _roll_mean(weights);  w_rs  = _roll_std(weights)
    d_rm  = _roll_mean(doors)

    # Domain features
    weight_delta_1h  = weight - weights[0]  if len(weights) > 1 else 0.0
    weight_delta_15m = weight - weights[-2] if len(weights) > 1 else 0.0
    sound_volatility = s_rs
    door_rate_1h     = d_rm
    temp_hum_product = round(temp * hum / 100, 3)
    temp_deviation   = temp - t_rm
    battery_delta    = 0.0  # not meaningful without prior reading; filled as 0

    # Temporal (cyclical)
    hour = ts.hour
    month = ts.month
    dow   = ts.weekday()

    row = {
        # Raw
        "temperature_c": temp,
        "humidity_pct" : hum,
        "sound_level"  : sound,
        "door_open"    : door,
        "weight_kg"    : weight,
        "battery_v"    : batt,
        # Temporal
        "hour_sin"    : np.sin(2 * np.pi * hour  / 24),
        "hour_cos"    : np.cos(2 * np.pi * hour  / 24),
        "month_sin"   : np.sin(2 * np.pi * (month - 1) / 12),
        "month_cos"   : np.cos(2 * np.pi * (month - 1) / 12),
        "is_daytime"  : int(7 <= hour <= 20),
        "day_of_week" : dow,
        # Rolling
        "temperature_c_roll_mean": t_rm,
        "temperature_c_roll_std" : t_rs,
        "humidity_pct_roll_mean" : h_rm,
        "humidity_pct_roll_std"  : h_rs,
        "sound_level_roll_mean"  : s_rm,
        "sound_level_roll_std"   : s_rs,
        "weight_kg_roll_mean"    : w_rm,
        "weight_kg_roll_std"     : w_rs,
        "door_open_roll_mean"    : d_rm,
        # Domain
        "weight_delta_1h"  : weight_delta_1h,
        "weight_delta_15m" : weight_delta_15m,
        "sound_volatility" : sound_volatility,
        "door_rate_1h"     : door_rate_1h,
        "temp_hum_product" : temp_hum_product,
        "temp_deviation"   : temp_deviation,
    }
    return pd.DataFrame([row])


def _compute_anomaly_score(X_raw: pd.DataFrame) -> tuple[float, bool]:
    """Run Isolation Forest and return (anomaly_score, is_anomaly)."""
    iso_feats  = _iso_bundle.get("features", list(X_raw.columns))
    scaler     = _iso_bundle["scaler"]
    iso        = _iso_bundle["isolation_forest"]

    # Only use features the ISO was trained on
    X_iso = X_raw[[c for c in iso_feats if c in X_raw.columns]].fillna(0)
    X_scaled = scaler.transform(X_iso)

    score      = float(iso.decision_function(X_scaled)[0])
    is_anomaly = score < _threshold
    return score, is_anomaly


def _classify(X_with_anomaly: pd.DataFrame) -> tuple[str, float, dict]:
    """Run classifier and return (label, confidence, all_proba)."""
    clf      = _clf_bundle["model"]
    classes  = _clf_bundle.get("classes", [])

    clf_feats = [c for c in _features if c in X_with_anomaly.columns]
    X_clf     = X_with_anomaly[clf_feats].fillna(0)

    # Handle XGBoost LabelEncoder if needed
    if hasattr(clf, 'classes_'):
        label_idx = clf.predict(X_clf)[0]
        # RF returns string directly
        label = str(label_idx)
        proba  = clf.predict_proba(X_clf)[0]
        cls_list = list(clf.classes_)
    else:
        # XGBoost with LabelEncoder — classes stored in bundle
        raw_pred = clf.predict(X_clf)[0]
        label    = classes[int(raw_pred)] if classes else str(raw_pred)
        proba    = clf.predict_proba(X_clf)[0]
        cls_list = classes

    confidence = float(max(proba))
    all_proba  = {str(c): round(float(p), 4) for c, p in zip(cls_list, proba)}
    return label, confidence, all_proba


# ── Public API ────────────────────────────────────────────────────────────────
def predict(dev_eui: str, decoded: dict,
            ts: datetime | None = None) -> PredictResult:
    """
    Main entry point — call from routes_webhooks.py.

    Parameters
    ----------
    dev_eui : str   Device EUI (used to key the rolling buffer)
    decoded : dict  Sensor payload: temperature_c, humidity_pct, sound_level,
                    door_open, weight_kg, gps_lat, gps_lng, battery_v
    ts      : datetime  Reading timestamp (defaults to utcnow)

    Returns
    -------
    PredictResult  with .label, .confidence, .anomaly_score, .should_alert, etc.
    """
    if ts is None:
        ts = datetime.now(timezone.utc)

    try:
        _load_models()
        buffer = _get_buffer(dev_eui)

        # Build feature matrix (before updating buffer)
        X = _build_features(decoded, buffer, ts)

        # Stage 1 — anomaly score
        anomaly_score, is_anomaly = _compute_anomaly_score(X)

        # Add anomaly_score as a feature for the classifier
        X["anomaly_score"] = anomaly_score

        # Stage 2 — classify
        label, confidence, all_proba = _classify(X)

        # Update buffer AFTER inference (no leakage)
        buffer.append({
            "temperature_c": decoded.get("temperature_c"),
            "humidity_pct" : decoded.get("humidity_pct"),
            "sound_level"  : decoded.get("sound_level"),
            "door_open"    : int(bool(decoded.get("door_open", False))),
            "weight_kg"    : decoded.get("weight_kg"),
        })

        meta = STATE_META.get(label, STATE_META["normal"])
        return PredictResult(
            label         = label,
            confidence    = confidence,
            label_fr      = meta["label_fr"],
            color         = meta["color"],
            severity      = meta["severity"],
            should_alert  = meta["alert"],
            anomaly_score = anomaly_score,
            is_anomaly    = is_anomaly,
            all_proba     = all_proba,
        )

    except Exception as exc:
        logger.exception("AI prediction failed for %s: %s", dev_eui, exc)
        return PredictResult(
            label="normal", confidence=0.0,
            label_fr="Normal (erreur IA)", color="gray",
            severity=0, should_alert=False,
            anomaly_score=0.0, is_anomaly=False,
            error=str(exc),
        )


def warm_up() -> None:
    try:
        _load_models()
        logger.info("IBEE AI warm-up complete.")
    except Exception as e:          # ← was: FileNotFoundError
        logger.warning("IBEE AI warm-up skipped: %s", e)