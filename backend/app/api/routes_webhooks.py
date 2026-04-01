from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.payload_v1 import decode_payload_v1_from_base64
from app.db.engine import get_session
from app.models.models import Device, Measurement

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_or_create_device(session: Session, dev_eui: str) -> Device:
    dev_eui = dev_eui.lower()
    device = session.exec(select(Device).where(Device.dev_eui == dev_eui)).first()
    if device:
        return device
    device = Device(dev_eui=dev_eui, status="online", last_seen_at=_utcnow())
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.post("/chirpstack/uplink")
def chirpstack_uplink(payload: dict[str, Any], session: Session = Depends(get_session)) -> dict:
    """
    Accepts ChirpStack v4 uplink event.

    Works with either:
    - decoded object: payload["object"] (dict)
    - raw base64: payload["data"] (string) + backend decoding (payload v1)
    """
    dev_eui = payload.get("deviceInfo", {}).get("devEui") or payload.get("devEui")
    if not dev_eui:
        raise HTTPException(status_code=400, detail="missing devEui / deviceInfo.devEui")

    device = _get_or_create_device(session, dev_eui)
    device.status = "online"
    device.last_seen_at = _utcnow()
    session.add(device)
    session.commit()

    ts = payload.get("time")
    if ts:
        try:
            ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            ts_dt = _utcnow()
    else:
        ts_dt = _utcnow()

    rx_info = (payload.get("rxInfo") or [{}])[0] if isinstance(payload.get("rxInfo"), list) else {}
    rssi = rx_info.get("rssi")
    snr = rx_info.get("snr")

    decoded: Optional[dict[str, Any]] = payload.get("object")
    if decoded is None:
        data_b64 = payload.get("data")
        if not data_b64:
            raise HTTPException(status_code=400, detail="missing object or data(base64)")
        decoded_v1 = decode_payload_v1_from_base64(data_b64)
        decoded = {
            "temperature_c": decoded_v1.temperature_c,
            "humidity_pct": decoded_v1.humidity_pct,
            "sound_level": decoded_v1.sound_level,
            "door_open": decoded_v1.door_open,
            "gps_lat": decoded_v1.gps_lat,
            "gps_lng": decoded_v1.gps_lng,
            "battery_v": decoded_v1.battery_v,
        }

    m = Measurement(
        device_id=device.id,  # type: ignore[arg-type]
        ts=ts_dt,
        temperature_c=decoded.get("temperature_c"),
        humidity_pct=decoded.get("humidity_pct"),
        sound_level=decoded.get("sound_level"),
        door_open=decoded.get("door_open"),
        gps_lat=decoded.get("gps_lat"),
        gps_lng=decoded.get("gps_lng"),
        battery_v=decoded.get("battery_v"),
        rssi=rssi,
        snr=snr,
    )
    session.add(m)
    session.commit()
    session.refresh(m)

    return {"ok": True, "device_dev_eui": device.dev_eui, "measurement_id": m.id}

