/**
 * ChirpStack v4: Codec for decoding uplinks (payload v1).
 *
 * Configure in ChirpStack:
 * - Device-profile: Payload codec = JavaScript
 * - Uplink codec: paste this file
 *
 * Output keys are aligned with backend expectations:
 * temperature_c, humidity_pct, sound_level, door_open, gps_lat, gps_lng, battery_v
 */

function bytesToInt16BE(b1, b2) {
  let v = (b1 << 8) | b2;
  if (v & 0x8000) v = v - 0x10000;
  return v;
}

function bytesToUint16BE(b1, b2) {
  return (b1 << 8) | b2;
}

function bytesToInt32BE(b1, b2, b3, b4) {
  let v = (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
  // force signed 32-bit
  v = v | 0;
  return v;
}

function decodeUplink(input) {
  const bytes = input.bytes || [];
  if (bytes.length < 17) {
    return { errors: ["payload too short"] };
  }

  const version = bytes[0];
  if (version !== 1) {
    return { errors: ["unsupported payload version: " + version] };
  }

  const tempRaw = bytesToInt16BE(bytes[1], bytes[2]);
  const humRaw = bytesToUint16BE(bytes[3], bytes[4]);
  const sound = bytes[5];
  const door = bytes[6];
  const latRaw = bytesToInt32BE(bytes[7], bytes[8], bytes[9], bytes[10]);
  const lngRaw = bytesToInt32BE(bytes[11], bytes[12], bytes[13], bytes[14]);
  const battRaw = bytesToUint16BE(bytes[15], bytes[16]);

  const data = {
    temperature_c: tempRaw === -32768 ? null : tempRaw / 100.0,
    humidity_pct: humRaw === 65535 ? null : humRaw / 100.0,
    sound_level: sound,
    door_open: !!door,
    gps_lat: latRaw === 0x7fffffff ? null : latRaw / 1e6,
    gps_lng: lngRaw === 0x7fffffff ? null : lngRaw / 1e6,
    battery_v: battRaw === 65535 ? null : battRaw / 1000.0,
  };

  return { data: data };
}

