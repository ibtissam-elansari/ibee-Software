import React from 'react'

const STATE_CONFIG = {
  normal: {
    label   : 'Normal',
    labelFr : 'Normal',
    classes : 'bg-green-50 text-green-700 border-green-200',
    dot     : 'bg-green-500',
  },
  swarming_risk: {
    label   : 'Essaimage',
    labelFr : 'Risque essaimage',
    classes : 'bg-amber-50 text-amber-700 border-amber-200',
    dot     : 'bg-amber-400',
  },
  robbing: {
    label   : 'Pillage',
    labelFr : 'Pillage détecté',
    classes : 'bg-red-50 text-red-700 border-red-200',
    dot     : 'bg-red-500',
  },
  winter_cluster: {
    label   : 'Hiver',
    labelFr : 'Cluster hivernal',
    classes : 'bg-blue-50 text-blue-700 border-blue-200',
    dot     : 'bg-blue-400',
  },
  empty: {
    label   : 'Vide',
    labelFr : 'Ruche vide',
    classes : 'bg-gray-50 text-gray-500 border-gray-200',
    dot     : 'bg-gray-400',
  },
}

const HiveStateBadge = ({ state, confidence, size = 'sm' }) => {
  if (!state || state === 'normal') return null   // don't clutter UI for normal state

  const cfg = STATE_CONFIG[state] ?? {
    label  : state,
    labelFr: state,
    classes: 'bg-gray-50 text-gray-500 border-gray-200',
    dot    : 'bg-gray-400',
  }

  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]'
  const pct      = confidence != null ? `${Math.round(confidence * 100)}%` : null
  const title    = pct ? `${cfg.labelFr} — confiance ${pct}` : cfg.labelFr

  return (
    <span
      title={title}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5
        rounded-full border font-semibold uppercase tracking-wide
        ${textSize} ${cfg.classes}
        cursor-default select-none
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
      {pct && <span className="opacity-60 font-normal normal-case tracking-normal">·{pct}</span>}
    </span>
  )
}

export default HiveStateBadge