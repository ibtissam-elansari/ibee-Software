import React from 'react';
import { useHiveRow } from '../hooks/useHiveRow';
import BatteryCell  from './BatteryCell';
import SignalCell   from './SignalCell';
import SecurityCell from './SecurityCell';

const HiveRow = ({ hive, latest: latestProp, onClick }) => { 
  const { isLoading, display } = useHiveRow(hive.id, latestProp); 

  const cell = 'px-4 py-4 text-sm';

  if (isLoading) {
    return (
      <tr className="border-b border-gray-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <td key={i} className="px-4 py-4">
            <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    );
  }

  return (
    <tr
      className={`${display.rowBg} transition-colors cursor-pointer p-20`}
      onClick={() => onClick?.(hive)}
    >
      {/* RUCHE ID — carries the left accent bar */}
      <td className={`${cell} ${display.leftAccent} font-bold text-gray-900 tracking-wide`}>
        {(hive.name ?? hive.dev_eui ?? '—').toUpperCase()}
      </td>

      {/* ETAT */}
      <td className={`${cell} ${display.statusColor}`}>
        {display.status}
      </td>

      {/* BATTERIE */}
      <td className={cell}>
        <BatteryCell value={display.batteryPct} />
      </td>

      {/* SONORE */}
      <td className={`${cell} ${display.soundColor}`}>
        {display.soundHz}
      </td>

      {/* HUMIDITÉ */}
      <td className={`${cell} ${display.humidityColor} pl-7`}>
        {display.humidity != null ? `${Math.round(display.humidity)}%` : '—'}
      </td>

      {/* TEMPÉRATURE */}
      <td className={`${cell} ${display.tempColor} pl-10`}>
        {display.temp != null ? `${Math.round(display.temp)}°C` : '—'}
      </td>

      {/* SIGNAL */}
      <td className={`${cell} pl-6`}>
        <SignalCell rssi={display.rssi} urgent={display.urgent} />
      </td>

      {/* SÉCURITÉ */}
      <td className={`${cell} pl-10`}>
        <SecurityCell doorOpen={display.doorOpen} />
      </td>
    </tr>
  );
};

export default HiveRow;