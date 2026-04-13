import React from 'react';

const BatteryCell = ({ value }) => {
  if (value == null) return <span className="text-base-300">—</span>;

  const pct = Math.round(value);

  const style =
    pct >= 40
      ? {  text: 'text-green-700', fill: '#16a34a' }
      : pct >= 20
      ? { text: 'text-orange-600', fill: '#ea580c' }
      : {    text: 'text-red-600',    fill: '#dc2626' };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {/* Battery SVG icon */}
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke={style.fill} strokeWidth="1"/>
        <rect x="14" y="3" width="1.5" height="4" rx="0.5" fill={style.fill}/>
        <rect x="1.5" y="1.5" width={`${(pct / 100) * 10}`} height="7" rx="1" fill={style.fill}/>
      </svg>
      {pct}%
    </span>
  );
};

export default BatteryCell;