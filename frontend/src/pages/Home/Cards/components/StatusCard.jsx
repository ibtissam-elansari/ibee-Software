import React from 'react'

const StatusCard = ({ card }) => {
  const {
    label,          // top label e.g. "Ruches actives"
    state,          // colored status text e.g. "Normale"
    stateColor,     // tailwind text color e.g. "text-green-600"
    title,          // big number/text
    subTitle,       // small description below
    icon,           // SVG element
    isLoading,
    urgent,         // if true, show red border
    extra,          // optional extra element (arrow button etc.)
  } = card;

  return (
    <div className={`
      relative flex flex-col justify-between
       rounded-2xl shadow-md border p-4
      min-h-[150px] transition-all duration-300
      ${urgent ? 'border-red-400 bg-red-50' : 'border-base-200 bg-white'}
    `}>

      {/* Top row — label + icon */}
      <div className="flex flex-row justify-between items-start">
        <div>
          {label && (
            <p className="text-xs text-base-content/60 font-medium mb-1">
              {label}
            </p>
          )}
          {state && (
            <p className={`text-sm font-semibold ${stateColor ?? 'text-base-content'}`}>
              {state}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>

      {/* Bottom row — title + subtitle */}
      <div className="flex flex-col items-baseline w-full">
        {isLoading ? (
          <div className="h-8 w-24 bg-base-200 rounded animate-pulse mt-2" />
        ) : (
          <h3 className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-base-content'}`}>
            {title ?? '—'}
          </h3>
        )}
        {isLoading ? (
          <div className="h-3 w-36 bg-base-200 rounded animate-pulse mt-2" />
        ) : (
          <p className="text-xs py-1 text-base-content/60">{subTitle}</p>
        )}
      </div>

      {/* Optional extra — e.g. the ">" arrow in the design */}
      {extra && (
        <div className="absolute bottom-4 right-4">
          {extra}
        </div>
      )}
    </div>
  );
};

export default StatusCard;