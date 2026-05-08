import React from 'react';
import { Lock, LockOpen, Battery } from 'lucide-react';

const SignalBars = ({ bars }) => {
  const color = '#D97706';
  const heights = [5, 9, 13];
  return (
    <span className="inline-flex items-end gap-[2px]">
      {heights.map((h, i) => (
        <span key={i} style={{
          display: 'inline-block', width: 3, height: h, borderRadius: 1,
          backgroundColor: i < bars ? color : '#D1D5DB',
        }} />
      ))}
    </span>
  );
};

export const StatusPills = ({ doorOpen, rssi, battPct, signalLabel }) => {
  const bars = rssi == null ? 0 : rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">

      {/* Sécurité */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-100 shadow-sm sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 sm:shadow-none">
        {doorOpen
          ? <LockOpen className="w-4 h-4 text-red-500 flex-shrink-0" />
          : <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
        }
        <div>
          <p className="text-[9px] text-gray-400 leading-none">Sécurité</p>
          <p className={`text-xs font-semibold leading-tight ${doorOpen ? 'text-red-500' : 'text-blue-600'}`}>
            {doorOpen ? 'Ouvert' : 'Fermé'}
          </p>
        </div>
      </div>

      <div className="w-px h-7 bg-gray-200 hidden sm:block" />

      {/* Signal */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-100 shadow-sm sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 sm:shadow-none">
        <SignalBars bars={bars} />
        <div>
          <p className="text-[9px] text-gray-400 leading-none">Signal</p>
          <p className="text-xs font-semibold leading-tight text-amber-600">{signalLabel}</p>
        </div>
      </div>

      <div className="w-px h-7 bg-gray-200 hidden sm:block" />

      {/* Batterie */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-100 shadow-sm sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 sm:shadow-none">
        <Battery className="w-4 h-4 text-green-500 flex-shrink-0" />
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