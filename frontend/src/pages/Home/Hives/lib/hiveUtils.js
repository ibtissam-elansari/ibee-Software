// ── Battery ──────────────────────────────────────────────────────────────────

/** Convert raw voltage to percentage. LiPo: 3.3V = 0%, 4.2V = 100%. */
export const voltsToPct = (v) =>
  v == null ? null : Math.min(100, Math.max(0, Math.round(((v - 3.3) / 0.9) * 100)));

// ── Sound ─────────────────────────────────────────────────────────────────────

/** Scale 0-100 sensor value to Hz display string. */
export const soundToHz = (level) =>
  level == null ? '—' : `${level * 2}Hz`;

// ── Status derivation ─────────────────────────────────────────────────────────

/**
 * Derive hive health status from latest measurements.
 * Returns: 'Urgente' | 'Attention' | 'Normale' | 'Inconnue'
 */
export const deriveStatus = (temp, humidity, sound, doorOpen) => {
  if (temp == null && humidity == null) return 'Inconnue';
  if ((temp ?? 0) > 40 || (humidity ?? 0) > 80 || doorOpen) return 'Urgente';
  if ((temp ?? 0) > 35 || (humidity ?? 0) > 70 || (sound ?? 0) > 80) return 'Attention';
  return 'Normale';
};

// ── Color helpers ─────────────────────────────────────────────────────────────

/**
 * Tailwind text-color class based on warn/crit thresholds.
 * Returns a Tailwind class string — keeps components free of conditional logic.
 */
export const thresholdColor = (value, warn, crit, baseClass = 'text-gray-700') => {
  if (value == null) return 'text-gray-400';
  if (value > crit)  return 'text-red-500 font-semibold';
  if (value > warn)  return 'text-amber-500 font-semibold';
  return baseClass;
};

export const statusColor = (status) => ({
  Urgente  : 'text-red-500 font-semibold',
  Attention: 'text-amber-500 font-semibold',
  Normale  : 'text-gray-700',
  Inconnue : 'text-gray-400',
}[status] ?? 'text-gray-400');

// ── Signal ────────────────────────────────────────────────────────────────────

/** Map RSSI dBm to bar count 1-3. */
export const rssiToBars = (rssi) =>
  rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1;

// ── Time formatting ───────────────────────────────────────────────────────────

/** Safe ISO → HH:mm:ss, returns '' on parse error. */
export const formatTime = (isoString, locale = 'fr-FR') => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString(locale, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return '';
  }
};