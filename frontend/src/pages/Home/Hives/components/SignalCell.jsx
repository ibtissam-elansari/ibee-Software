import React from 'react';

const SignalCell = ({ rssi, urgent = false }) => {
  if (rssi == null) return <span className="text-base-300">—</span>;

  const strength = rssi >= -70 ? 3 : rssi >= -85 ? 2 : 1;
  const color = urgent ? '#dc2626' : '#d97706'; // red : amber

  const bars = [
    { height: 6,  filled: strength >= 1 },
    { height: 10, filled: strength >= 2 },
    { height: 14, filled: strength >= 3 },
  ];

  return (
    <span className="inline-flex items-end gap-[3px]">
      {bars.map((bar, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 4,
            height: bar.height,
            borderRadius: 1,
            backgroundColor: bar.filled ? color : '#d1d5db',
          }}
        />
      ))}
    </span>
  );
};

export default SignalCell;