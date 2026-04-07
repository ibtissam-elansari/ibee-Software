# payload_v1.py: 

from __future__ import annotations

import base64
import struct
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PayloadV1:
    version: int
    temperature_c: Optional[float]
    humidity_pct: Optional[float]
    sound_level: Optional[int]
    door_open: Optional[bool]
    gps_lat: Optional[float]
    gps_lng: Optional[float]
    battery_v: Optional[float]


def _i16(x: int) -> float:
    return x / 100.0


def _u16_pct(x: int) -> float:
    return x / 100.0


def _gps(x: int) -> float:
    return x / 1_000_000.0


def decode_payload_v1_from_base64(data_b64: str) -> PayloadV1:
    raw = base64.b64decode(data_b64)
    if len(raw) < 17:
        raise ValueError(f"payload too short (got {len(raw)} bytes, need >= 17)")

    version = raw[0]
    if version != 1:
        raise ValueError(f"unsupported payload version: {version}")

    # Layout:
    # 0: version u8
    # 1-2: temp int16 (centi-deg)
    # 3-4: hum u16 (centi-%)
    # 5: sound u8 (0-100)
    # 6: door u8 (0/1)
    # 7-10: lat int32 (deg * 1e6)
    # 11-14: lng int32 (deg * 1e6)
    # 15-16: battery u16 (mV)
    temp_i16 = struct.unpack(">h", raw[1:3])[0]
    hum_u16 = struct.unpack(">H", raw[3:5])[0]
    sound_u8 = raw[5]
    door_u8 = raw[6]
    lat_i32 = struct.unpack(">i", raw[7:11])[0]
    lng_i32 = struct.unpack(">i", raw[11:15])[0]
    batt_mv = struct.unpack(">H", raw[15:17])[0]

    # Sentinel strategy (can be adapted to firmware):
    # - temp: -32768 => missing
    # - hum:  65535 => missing
    # - gps:  0x7fffffff => missing
    # - batt: 65535 => missing
    temperature_c = None if temp_i16 == -32768 else _i16(temp_i16)
    humidity_pct = None if hum_u16 == 65535 else _u16_pct(hum_u16)
    gps_lat = None if lat_i32 == 0x7FFFFFFF else _gps(lat_i32)
    gps_lng = None if lng_i32 == 0x7FFFFFFF else _gps(lng_i32)
    battery_v = None if batt_mv == 65535 else batt_mv / 1000.0

    sound_level = int(sound_u8)
    door_open = bool(door_u8)

    return PayloadV1(
        version=version,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        sound_level=sound_level,
        door_open=door_open,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        battery_v=battery_v,
    )

