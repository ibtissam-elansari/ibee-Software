from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.api.schemas import (
    HiveCreate,
    HiveOut,
    DeviceCreate,
    LatestMeasurementOut,
    HistoryPointOut,
)
from app.db.engine import get_session
from app.models.models import Device, Hive, Measurement

router = APIRouter()


# ---------- HIVE ROUTES ----------

@router.post("/hives", response_model=HiveOut)
def create_hive(
    payload: HiveCreate,
    session: Session = Depends(get_session),
):
    hive = Hive(**payload.model_dump())
    session.add(hive)
    session.commit()
    session.refresh(hive)
    return hive


@router.get("/hives", response_model=list[HiveOut])
def list_hives(session: Session = Depends(get_session)):
    return session.exec(select(Hive)).all()


@router.get("/hives/{hive_id}", response_model=HiveOut)
def get_hive(hive_id: int, session: Session = Depends(get_session)):
    hive = session.get(Hive, hive_id)
    if not hive:
        raise HTTPException(status_code=404, detail="hive not found")
    return hive


@router.get("/hives/{hive_id}/latest", response_model=LatestMeasurementOut)
def hive_latest(hive_id: int, session: Session = Depends(get_session)):
    # Get latest measurement across ALL devices of the hive
    m = session.exec(
        select(Measurement, Device)
        .join(Device, Device.id == Measurement.device_id)
        .where(Device.hive_id == hive_id)
        .order_by(Measurement.ts.desc())
        .limit(1)
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="no measurements yet")

    measurement, device = m

    return LatestMeasurementOut(
        device_dev_eui=device.dev_eui,
        ts=measurement.ts,
        temperature_c=measurement.temperature_c,
        humidity_pct=measurement.humidity_pct,
        sound_level=measurement.sound_level,
        door_open=measurement.door_open,
        gps_lat=measurement.gps_lat,
        gps_lng=measurement.gps_lng,
        battery_v=measurement.battery_v,
        rssi=measurement.rssi,
        snr=measurement.snr,
    )


# ---------- DEVICE ROUTES ----------

@router.post("/devices")
def create_or_attach_device(
    payload: DeviceCreate,
    session: Session = Depends(get_session),
):
    dev_eui = payload.dev_eui.lower()

    device = session.exec(
        select(Device).where(Device.dev_eui == dev_eui)
    ).first()

    if device is None:
        device = Device(dev_eui=dev_eui, hive_id=payload.hive_id)
        session.add(device)
    else:
        device.hive_id = payload.hive_id
        session.add(device)

    session.commit()
    session.refresh(device)

    return {
        "id": device.id,
        "dev_eui": device.dev_eui,
        "hive_id": device.hive_id,
    }


@router.get("/devices/{dev_eui}/history", response_model=list[HistoryPointOut])
def device_history(
    dev_eui: str,
    start: Optional[datetime] = Query(default=None),
    end: Optional[datetime] = Query(default=None),
    limit: int = Query(default=1000, ge=1, le=5000),
    session: Session = Depends(get_session),
):
    dev_eui = dev_eui.lower()

    device = session.exec(
        select(Device).where(Device.dev_eui == dev_eui)
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="device not found")

    q = select(Measurement).where(Measurement.device_id == device.id)

    if start:
        q = q.where(Measurement.ts >= start)
    if end:
        q = q.where(Measurement.ts <= end)

    rows = session.exec(
        q.order_by(Measurement.ts.desc()).limit(limit)
    ).all()

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