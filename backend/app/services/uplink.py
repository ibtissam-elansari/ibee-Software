from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.routes_hives import update_sse_cache
from app.core.payload_v1 import decode_payload_v1_from_base64
from app.models.models import Device, Hive, Measurement
from app.ai.predict import predict as ai_predict


DEFAULT_APICULTEUR_ID = 1

_BATT_V_MIN = 10.0
_BATT_V_MAX = 15.1

# KY-037 ADC full scale (12-bit)
_MIC_ADC_MAX = 4095.0


# ── Helpers ───────────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _soc_to_voltage(soc_pct: float) -> float:
    """Linear SOC → pack voltage. 0 % → 10.0 V, 100 % → 15.1 V."""
    return round(_BATT_V_MIN + (float(soc_pct) / 100.0) * (_BATT_V_MAX - _BATT_V_MIN), 3)


def _normalize_object(obj: dict[str, Any]) -> dict[str, Any]:
    """
    Accept either real-device field names or already-normalised simulator
    names and return a unified internal dict.

    Priority: normalised key first (simulator), then raw device key.
    This means the simulator still works without any changes.
    """

    # ── temperature ──────────────────────────────────────────────────────────
    temperature_c: Optional[float] = (
        obj.get("temperature_c")    # simulator / already normalised
        if obj.get("temperature_c") is not None
        else obj.get("temperature") # real device
    )

    # ── humidity ─────────────────────────────────────────────────────────────
    humidity_pct: Optional[float] = (
        obj.get("humidity_pct")
        if obj.get("humidity_pct") is not None
        else obj.get("humidity")
    )

    # ── sound level ──────────────────────────────────────────────────────────
    sound_level: Optional[int]
    if obj.get("sound_level") is not None:
        sound_level = int(obj["sound_level"])
    elif obj.get("micAnalog") is not None:
        sound_level = round(int(obj["micAnalog"]) / _MIC_ADC_MAX * 100)
    else:
        sound_level = None

    # ── door open ────────────────────────────────────────────────────────────
    door_open: Optional[bool]
    if obj.get("door_open") is not None:
        door_open = bool(obj["door_open"])
    elif obj.get("door") is not None:
        door_open = str(obj["door"]).upper() == "OUVERTE"
    else:
        door_open = None

    # ── weight ───────────────────────────────────────────────────────────────
    weight_kg: Optional[float]
    if obj.get("weight_kg") is not None:
        weight_kg = float(obj["weight_kg"])
    elif obj.get("weightKg") is not None:
        weight_kg = float(obj["weightKg"])
    else:
        weight_kg = None

    # ── GPS ───────────────────────────────────────────────────────────────────
    gps_lat: Optional[float] = (
        obj.get("gps_lat")
        if obj.get("gps_lat") is not None
        else obj.get("latitude")
    )
    gps_lng: Optional[float] = (
        obj.get("gps_lng")
        if obj.get("gps_lng") is not None
        else obj.get("longitude")
    )
    if gps_lat == 0.0:
        gps_lat = None
    if gps_lng == 0.0:
        gps_lng = None

    # ── battery ───────────────────────────────────────────────────────────────
    battery_v: Optional[float]
    if obj.get("battery_v") is not None:
        battery_v = float(obj["battery_v"])
    elif obj.get("soc_pct") is not None:
        battery_v = _soc_to_voltage(obj["soc_pct"])
    else:
        battery_v = None

    return {
        "temperature_c": temperature_c,
        "humidity_pct":  humidity_pct,
        "sound_level":   sound_level,
        "door_open":     door_open,
        "weight_kg":     weight_kg,
        "gps_lat":       gps_lat,
        "gps_lng":       gps_lng,
        "battery_v":     battery_v,
    }


async def _get_or_create_device(session: AsyncSession, dev_eui: str) -> Device:
    dev_eui = dev_eui.lower()
    result  = await session.execute(select(Device).where(Device.dev_eui == dev_eui))
    device  = result.scalars().first()
    if device:
        return device
    device = Device(dev_eui=dev_eui, status="online", last_seen_at=_utcnow())
    session.add(device)
    await session.commit()
    await session.refresh(device)
    return device


# ── Main entry point ──────────────────────────────────────────────────────────

async def process_uplink(payload: dict[str, Any], session: AsyncSession) -> dict:
    """
    Process a single ChirpStack v4 uplink event.

    Called by:
      • Kafka consumer                     (primary)
      • POST /webhooks/chirpstack/uplink   (fallback)

    Raises HTTPException on bad input so the webhook route can return proper
    HTTP error codes. The Kafka consumer catches generic Exception and logs.
    """

    # ── Extract DevEUI ────────────────────────────────────────────────────────
    dev_eui = (
        payload.get("deviceInfo", {}).get("devEui")
        or payload.get("devEui")
    )
    if not dev_eui:
        raise HTTPException(status_code=400, detail="missing devEui / deviceInfo.devEui")

    # ── Get or create device ──────────────────────────────────────────────────
    device = await _get_or_create_device(session, dev_eui)

    # ── Auto-create hive if device is unlinked ────────────────────────────────
    if device.hive_id is None:
        hive = Hive(
            name          = f"Ruche-{device.dev_eui[-4:].upper()}",
            location_name = "Auto-créée — à réassigner si nécessaire",
            apiculteur_id = DEFAULT_APICULTEUR_ID,
            is_active     = True,
        )
        session.add(hive)
        await session.commit()
        await session.refresh(hive)

        device.hive_id = hive.id
        session.add(device)
        await session.commit()
        await session.refresh(device)

        print(
            f"✅  Device {device.dev_eui} → new hive '{hive.name}' "
            f"(id={hive.id}) assigned to apiculteur {DEFAULT_APICULTEUR_ID}"
        )

    # ── Update device heartbeat ───────────────────────────────────────────────
    device.status       = "online"
    device.last_seen_at = _utcnow()
    session.add(device)
    await session.commit()
    await session.refresh(device)

    # ── Parse timestamp ───────────────────────────────────────────────────────
    ts_raw = payload.get("time")
    if ts_raw:
        try:
            ts_dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except Exception:
            ts_dt = _utcnow()
    else:
        ts_dt = _utcnow()

    # ── Extract signal info ───────────────────────────────────────────────────
    rx_list = payload.get("rxInfo") or []
    rx_info = rx_list[0] if isinstance(rx_list, list) and rx_list else {}
    rssi    = rx_info.get("rssi")
    snr     = rx_info.get("snr")

    # ── Decode / normalise sensor payload ─────────────────────────────────────
    raw_obj: Optional[dict[str, Any]] = payload.get("object")

    if raw_obj is not None:
        decoded = _normalize_object(raw_obj)
    else:
        data_b64 = payload.get("data")
        if not data_b64:
            raise HTTPException(
                status_code=400,
                detail="missing both 'object' and 'data' fields",
            )
        try:
            p = decode_payload_v1_from_base64(data_b64)
            decoded = {
                "temperature_c": p.temperature_c,
                "humidity_pct":  p.humidity_pct,
                "sound_level":   p.sound_level,
                "door_open":     p.door_open,
                "weight_kg":     getattr(p, "weight_kg", None),
                "gps_lat":       p.gps_lat,
                "gps_lng":       p.gps_lng,
                "battery_v":     p.battery_v,
            }
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"payload decode error: {exc}")

    # ── Resolve apiculteur_id ─────────────────────────────────────────────────
    apiculteur_id: Optional[int] = None
    hive = await session.get(Hive, device.hive_id)
    if hive:
        apiculteur_id = hive.apiculteur_id

    # ── Persist measurement ───────────────────────────────────────────────────
    m = Measurement(
        device_id     = device.id,
        apiculteur_id = apiculteur_id,
        ts            = ts_dt,
        temperature_c = decoded.get("temperature_c"),
        humidity_pct  = decoded.get("humidity_pct"),
        sound_level   = decoded.get("sound_level"),
        door_open     = decoded.get("door_open"),
        weight_kg     = decoded.get("weight_kg"),
        gps_lat       = decoded.get("gps_lat"),
        gps_lng       = decoded.get("gps_lng"),
        battery_v     = decoded.get("battery_v"),
        rssi          = rssi,
        snr           = snr,
    )
    ai              = ai_predict(device.dev_eui, decoded, ts_dt)
    m.hive_state    = ai.label
    m.ai_confidence = ai.confidence
    session.add(m)
    await session.commit()
    await session.refresh(m)

    # ── Push to SSE stream ────────────────────────────────────────────────────
    sse_payload = {
        "id"            : m.id,
        "ts"            : m.ts.isoformat(),
        "device_dev_eui": device.dev_eui,
        "temperature_c" : m.temperature_c,
        "humidity_pct"  : m.humidity_pct,
        "sound_level"   : m.sound_level,
        "door_open"     : m.door_open,
        "weight_kg"     : m.weight_kg,
        "gps_lat"       : m.gps_lat,
        "gps_lng"       : m.gps_lng,
        "battery_v"     : m.battery_v,
        "rssi"          : m.rssi,
        "snr"           : m.snr,
        "hive_state"    : m.hive_state,
        "ai_confidence" : m.ai_confidence,
        "ai_color"      : ai.color,
    }
    update_sse_cache(device.hive_id, sse_payload)

    return {
        "ok"             : True,
        "device_dev_eui" : device.dev_eui,
        "measurement_id" : m.id,
        "hive_id"        : device.hive_id,
    }