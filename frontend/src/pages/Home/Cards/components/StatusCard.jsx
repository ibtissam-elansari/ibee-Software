import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LockOpen, X, ChevronDown } from 'lucide-react'

const OpenHivesPopover = ({ hives, cardRef, anchorRef, onClose }) => {
  const popoverRef    = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  const reposition = useCallback(() => {
    const rect = cardRef?.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ top: rect.bottom + 8, left: rect.left, width: rect.width })
  }, [cardRef])

  useEffect(() => {
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [reposition])

  useEffect(() => {
    const handler = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        anchorRef.current  && !anchorRef.current.contains(e.target)
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-red-50">
        <div className="flex items-center gap-1.5">
          <LockOpen className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-red-700">
            {hives.length} ruche{hives.length > 1 ? 's' : ''} ouverte{hives.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Hive rows */}
      <div className="overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '200px' }}>
        {hives.map((hive, i) => (
          <div
            key={hive.id ?? i}
            className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center flex-shrink-0">
                <LockOpen className="w-3 h-3 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {hive.name?.toUpperCase() ?? `Ruche ${hive.id}`}
                </p>
                {hive.location_name && (
                  <p className="text-[10px] text-gray-400 truncate">{hive.location_name}</p>
                )}
              </div>
            </div>
            <span className="ml-2 flex-shrink-0 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-bold uppercase">
              Ouverte
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">Vérifiez ces ruches immédiatement</p>
      </div>
    </div>,
    document.body
  )
}

const StatusCard = ({ card }) => {
  const {
    label, state, stateColor, title, subTitle,
    icon, isLoading, urgent, openHives,
  } = card

  const [popoverOpen, setPopoverOpen] = useState(false)
  const btnRef  = useRef(null)
  const cardRef = useRef(null)
  const hasOpen = openHives && openHives.length > 0

  return (
    <div
      ref={cardRef}
      className={`
        relative flex flex-col justify-between
        rounded-2xl shadow-md border p-4 min-h-[150px] transition-all duration-300
        ${urgent ? 'border-red-400 bg-red-50' : 'border-base-200 bg-white'}
      `}
    >
      <div className="flex flex-row justify-between items-start">
        <div>
          {label && <p className="text-xs text-base-content/60 font-medium mb-1">{label}</p>}
          {state && <p className={`text-sm font-semibold ${stateColor ?? 'text-base-content'}`}>{state}</p>}
        </div>
        <div className="flex-shrink-0">{icon}</div>
      </div>

      <div className="flex flex-col items-baseline w-full">
        {isLoading
          ? <div className="h-8 w-24 bg-base-200 rounded animate-pulse mt-2" />
          : <h3 className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-base-content'}`}>{title ?? '—'}</h3>
        }
        {isLoading
          ? <div className="h-3 w-36 bg-base-200 rounded animate-pulse mt-2" />
          : <p className="text-xs py-1 text-base-content/60">{subTitle}</p>
        }
      </div>

      {hasOpen && (
        <button
          ref={btnRef}
          onClick={() => setPopoverOpen(v => !v)}
          className={`
            absolute bottom-4 right-4 p-1 rounded-full transition-all duration-200
            ${popoverOpen ? 'bg-red-100 text-red-600' : 'hover:bg-base-200 text-base-content/40'}
          `}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {hasOpen && popoverOpen && (
        <OpenHivesPopover
          hives={openHives}
          cardRef={cardRef}
          anchorRef={btnRef}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </div>
  )
}

export default StatusCard