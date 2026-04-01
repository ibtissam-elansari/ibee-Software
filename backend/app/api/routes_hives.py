from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.api.schemas import HistoryPointOut, LatestMeasurementOut
from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement

router = APIRouter()


@router.post("/hives")
def create_hive(
    name: str,
    location_name: Optional[str] = None,
    session: Session = Depends(get_session),
) -> dict:
    hive = Hive(name=name, location_name=location_name)
    session.add(hive)
    session.commit()
    session.refresh(hive)
    return {"id": hive.id, "name": hive.name, "location_name": hive.location_name}


@router.post("/devices")
def create_or_attach_device(
    dev_eui: str,
    hive_id: Optional[int] = None,
    session: Session = Depends(get_session),
) -> dict:
    dev_eui = dev_eui.lower()
    device = session.exec(select(Device).where(Device.dev_eui == dev_eui)).first()
    if device is None:
        device = Device(dev_eui=dev_eui, hive_id=hive_id)
        session.add(device)
    else:
        device.hive_id = hive_id
        session.add(device)
    session.commit()
    session.refresh(device)
    return {"id": device.id, "dev_eui": device.dev_eui, "hive_id": device.hive_id}


@router.get("/hives/{hive_id}/latest", response_model=LatestMeasurementOut)
def hive_latest(hive_id: int, session: Session = Depends(get_session)) -> LatestMeasurementOut:
    device = session.exec(select(Device).where(Device.hive_id == hive_id)).first()
    if not device:
        raise HTTPException(status_code=404, detail="no device attached to hive")

    m = session.exec(
        select(Measurement)
        .where(Measurement.device_id == device.id)
        .order_by(Measurement.ts.desc())
        .limit(1)
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="no measurements yet")

    return LatestMeasurementOut(
        device_dev_eui=device.dev_eui,
        ts=m.ts,
        temperature_c=m.temperature_c,
        humidity_pct=m.humidity_pct,
        sound_level=m.sound_level,
        door_open=m.door_open,
        gps_lat=m.gps_lat,
        gps_lng=m.gps_lng,
        battery_v=m.battery_v,
        rssi=m.rssi,
        snr=m.snr,
    )


@router.get("/devices/{dev_eui}/history", response_model=list[HistoryPointOut])
def device_history(
    dev_eui: str,
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=5000),
    session: Session = Depends(get_session),
) -> list[HistoryPointOut]:
    dev_eui = dev_eui.lower()
    device = session.exec(select(Device).where(Device.dev_eui == dev_eui)).first()
    if not device:
        raise HTTPException(status_code=404, detail="device not found")

    q = select(Measurement).where(Measurement.device_id == device.id)
    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    rows = session.exec(q.order_by(Measurement.ts.desc()).limit(limit)).all()
    return [
        HistoryPointOut(
            ts=m.ts,
            temperature_c=m.temperature_c,
            humidity_pct=m.humidity_pct,
            sound_level=m.sound_level,
            door_open=m.door_open,
            gps_lat=m.gps_lat,
            gps_lng=m.gps_lng,
            battery_v=m.battery_v,
            rssi=m.rssi,
            snr=m.snr,
        )
        for m in rows
    ]

