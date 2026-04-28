from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.api.routes_hives import update_sse_cache
from app.core.payload_v1 import decode_payload_v1_from_base64
from app.db.engine import get_session
from app.models.models import Device, Measurement, Hive

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


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


@router.post("/chirpstack/uplink")
async def chirpstack_uplink(
    payload : dict[str, Any],
    session : AsyncSession = Depends(get_session),
) -> dict:
    """
    Receives ChirpStack v4 HTTP integration uplink events.

    Supports two payload shapes:
      1. Decoded object:  payload["object"]  (when JS codec is configured)
      2. Raw base64:      payload["data"]    (when no codec)

    Fields extracted from payload["object"]:
      temperature_c, humidity_pct, sound_level, door_open,
      weight_kg (NEW), gps_lat, gps_lng, battery_v

    After persisting, updates the SSE cache for connected dashboard clients.
    """
    # ── Extract DevEUI ───────────────────────────────────────────────────────
    dev_eui = (
        payload.get("deviceInfo", {}).get("devEui")
        or payload.get("devEui")
    )
    if not dev_eui:
        raise HTTPException(status_code=400, detail="missing devEui / deviceInfo.devEui")

    # ── Get or create device ─────────────────────────────────────────────────
    device = await _get_or_create_device(session, dev_eui)

    # ── Auto-create placeholder hive if device is unlinked ───────────────────
    if device.hive_id is None:
        hive = Hive(
            name          = f"Ruche-{device.dev_eui[-4:]}",
            location_name = "Auto-created — assign to an apiculteur",
            apiculteur_id = None,
            deleted_at    = _utcnow(),   # soft-deleted until a superuser assigns it
        )
        session.add(hive)
        await session.commit()
        await session.refresh(hive)

        device.hive_id = hive.id
        session.add(device)
        await session.commit()
        await session.refresh(device)

        print(f"⚠️  Device {device.dev_eui} → unlinked placeholder hive {hive.id} (needs apiculteur assignment)")

    # ── Update device heartbeat ──────────────────────────────────────────────
    device.status       = "online"
    device.last_seen_at = _utcnow()
    session.add(device)
    await session.commit()
    await session.refresh(device)

    # ── Parse timestamp ──────────────────────────────────────────────────────
    ts_raw = payload.get("time")
    if ts_raw:
        try:
            ts_dt = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except Exception:
            ts_dt = _utcnow()
    else:
        ts_dt = _utcnow()

    # ── Extract signal info ──────────────────────────────────────────────────
    rx_list = payload.get("rxInfo") or []
    rx_info = rx_list[0] if isinstance(rx_list, list) and rx_list else {}
    rssi    = rx_info.get("rssi")
    snr     = rx_info.get("snr")

    # ── Decode payload (object path OR binary path) ──────────────────────────
    decoded: Optional[dict[str, Any]] = payload.get("object")

    if decoded is None:
        data_b64 = payload.get("data")
        if not data_b64:
            raise HTTPException(
                status_code=400,
                detail="missing both 'object' and 'data' fields",
            )
        try:
            p = decode_payload_v1_from_base64(data_b64)
            decoded = {
                "temperature_c" : p.temperature_c,
                "humidity_pct"  : p.humidity_pct,
                "sound_level"   : p.sound_level,
                "door_open"     : p.door_open,
                "weight_kg"     : getattr(p, "weight_kg", None),   # NEW — graceful if codec omits it
                "gps_lat"       : p.gps_lat,
                "gps_lng"       : p.gps_lng,
                "battery_v"     : p.battery_v,
            }
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"payload decode error: {exc}")

    # ── Resolve apiculteur_id from hive ──────────────────────────────────────
    apiculteur_id: Optional[int] = None
    if device.hive_id is not None:
        hive = await session.get(Hive, device.hive_id)
        if hive:
            apiculteur_id = hive.apiculteur_id

    # ── Persist measurement ──────────────────────────────────────────────────
    m = Measurement(
        device_id     = device.id,
        apiculteur_id = apiculteur_id,
        ts            = ts_dt,
        temperature_c = decoded.get("temperature_c"),
        humidity_pct  = decoded.get("humidity_pct"),
        sound_level   = decoded.get("sound_level"),
        door_open     = decoded.get("door_open"),
        weight_kg     = decoded.get("weight_kg"),     # NEW
        gps_lat       = decoded.get("gps_lat"),
        gps_lng       = decoded.get("gps_lng"),
        battery_v     = decoded.get("battery_v"),
        rssi          = rssi,
        snr           = snr,
    )
    session.add(m)
    await session.commit()
    await session.refresh(m)

    # ── Push to SSE stream ───────────────────────────────────────────────────
    if device.hive_id is not None:
        sse_payload = {
            "id"            : m.id,
            "ts"            : m.ts.isoformat(),
            "device_dev_eui": device.dev_eui,
            "temperature_c" : m.temperature_c,
            "humidity_pct"  : m.humidity_pct,
            "sound_level"   : m.sound_level,
            "door_open"     : m.door_open,
            "weight_kg"     : m.weight_kg,            # NEW
            "gps_lat"       : m.gps_lat,
            "gps_lng"       : m.gps_lng,
            "battery_v"     : m.battery_v,
            "rssi"          : m.rssi,
            "snr"           : m.snr,
        }
        update_sse_cache(device.hive_id, sse_payload)

    return {
        "ok"             : True,
        "device_dev_eui" : device.dev_eui,
        "measurement_id" : m.id,
        "hive_id"        : device.hive_id,
    }