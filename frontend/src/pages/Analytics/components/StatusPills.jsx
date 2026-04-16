import React from 'react';
import { Lock, LockOpen, Battery } from 'lucide-react';

/**
 * StatusPills — the three status chips in the top-right of HiveAnalyticsPage.
 * Matches Figma: Sécurité (blue lock) · Signal (bar chart) · Batterie (green battery + %)
 */

const SignalBars = ({ bars }) => {
  const color = '#D97706';
  const heights = [5, 9, 13];
  return (
    <span className="inline-flex items-end gap-[2px]">
      {heights.map((h, i) => (
        <span key={i} style={{
          display:'inline-block', width:3, height:h, borderRadius:1,
          backgroundColor: i < bars ? color : '#D1D5DB',
        }}/>
      ))}
    </span>
  );
};

export const StatusPills = ({ doorOpen, rssi, battPct, signalLabel }) => {
  const bars = rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1;

  return (
    <div className="flex items-center gap-3">
      {/* Sécurité */}
      <div className="flex items-center gap-1.5">
        {doorOpen
          ? <LockOpen className="w-4 h-4 text-red-500" />
          : <Lock className="w-4 h-4 text-blue-600" />
        }
        <div>
          <p className="text-[9px] text-gray-400 leading-none">Sécurité</p>
          <p className={`text-xs font-semibold leading-tight ${doorOpen ? 'text-red-500' : 'text-blue-600'}`}>
            {doorOpen ? 'Ouvert' : 'Fermé'}
          </p>
        </div>
      </div>

      <div className="w-px h-7 bg-gray-200" />

      {/* Signal */}
      <div className="flex items-center gap-1.5">
        <SignalBars bars={bars} />
        <div>
          <p className="text-[9px] text-gray-400 leading-none">Signal</p>
          <p className="text-xs font-semibold leading-tight text-amber-600">{signalLabel}</p>
        </div>
      </div>

      <div className="w-px h-7 bg-gray-200" />

      {/* Batterie */}
      <div className="flex items-center gap-1.5">
        <Battery className="w-4 h-4 text-green-500" />
        <div>
          <p className="text-[9px] text-gray-400 leading-none">Batterie</p>
          <p className="text-xs font-semibold leading-tight text-green-600">
            {battPct != null ? `${battPct}%` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};