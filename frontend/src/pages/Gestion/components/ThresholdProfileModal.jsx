// src/pages/Gestion/components/ThresholdProfileModal.jsx

import { useEffect, useState } from 'react';
import { X, Plus, Pencil, Trash2, Thermometer, Droplets, Volume2, Weight } from 'lucide-react';

/* ── Reusable number input ─────────────────────────────────────────────────── */
const NumInput = ({ label, value, onChange, unit, placeholder = '—' }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2
                    focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full text-sm text-gray-800 outline-none bg-transparent min-w-0 placeholder:text-gray-300"
      />
      <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>
    </div>
  </div>
);

/* ── Metric section (Attention + Urgente) ──────────────────────────────────── */
const MetricSection = ({ icon: Icon, colorClass, title, fields, unit }) => (
  <div className="rounded-xl border border-gray-100 overflow-hidden">
    <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${colorClass}`}>
      <Icon size={14} />
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className={`grid grid-cols-2 gap-3 px-4 py-3.5 bg-gray-50/40`}>
      {fields.map(({ label, key, value, onChange }) => (
        <NumInput key={key} label={label} unit={unit} value={value} onChange={onChange} />
      ))}
    </div>
  </div>
);

/* ── Backdrop + shell ──────────────────────────────────────────────────────── */
const Backdrop = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════════ */
const ThresholdProfileModal = ({
  modal,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  creating,
  updating,
  deleting,
}) => {
  if (!modal) return null;
  const { type, profile } = modal;

  /* state mirrors backend flat fields (same as HiveThreshold) */
  const [name,           setName]           = useState('');
  const [tempAttention,  setTempAttention]  = useState(null);
  const [tempUrgente,    setTempUrgente]    = useState(null);
  const [humAttention,   setHumAttention]   = useState(null);
  const [humUrgente,     setHumUrgente]     = useState(null);
  const [soundLevel,     setSoundLevel]     = useState(null);
  const [batteryV,       setBatteryV]       = useState(null);
  const [weightDropKg,   setWeightDropKg]   = useState(null);

  useEffect(() => {
    if (type === 'edit' && profile) {
      setName(profile.name ?? '');
      setTempAttention(profile.temp_attention ?? null);
      setTempUrgente(profile.temp_urgente     ?? null);
      setHumAttention(profile.hum_attention   ?? null);
      setHumUrgente(profile.hum_urgente       ?? null);
      setSoundLevel(profile.sound_level       ?? null);
      setBatteryV(profile.battery_v           ?? null);
      setWeightDropKg(profile.weight_drop_kg  ?? null);
    } else {
      setName(''); setTempAttention(null); setTempUrgente(null);
      setHumAttention(null); setHumUrgente(null);
      setSoundLevel(null); setBatteryV(null); setWeightDropKg(null);
    }
  }, [type, profile]);

  const buildPayload = () => ({
    name,
    temp_attention : tempAttention,
    temp_urgente   : tempUrgente,
    hum_attention  : humAttention,
    hum_urgente    : humUrgente,
    sound_level    : soundLevel,
    battery_v      : batteryV,
    weight_drop_kg : weightDropKg,
  });

  /* ── DELETE ────────────────────────────────────────────────────────────── */
  if (type === 'delete' && profile) return (
    <Backdrop onClose={onClose}>
      <div className="relative w-[420px] max-w-full rounded-2xl bg-white shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition">
          <X size={16} />
        </button>
        <div className="px-6 pt-6 pb-4 border-b border-red-100 bg-red-50">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-100"><Trash2 size={16} className="text-red-500" /></span>
            <div>
              <h2 className="font-semibold text-gray-800">Supprimer le profil</h2>
              <p className="text-xs text-gray-400 mt-0.5">Les ruches assignées reviendront aux seuils globaux</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer le profil{' '}
            <span className="font-semibold text-gray-800">«&nbsp;{profile.name}&nbsp;»</span> ?
            Cette action est irréversible.
          </p>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
            Annuler
          </button>
          <button
            onClick={() => onDelete(profile.id)}
            disabled={deleting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </Backdrop>
  );

  /* ── CREATE / EDIT ──────────────────────────────────────────────────────── */
  const isEdit    = type === 'edit';
  const isBusy    = isEdit ? updating : creating;
  const submitLabel = isEdit ? (isBusy ? 'Enregistrement…' : 'Enregistrer') : (isBusy ? 'Ajout…' : 'Ajouter');

  return (
    <Backdrop onClose={onClose}>
      <div className="relative w-[560px] max-w-full rounded-2xl bg-white shadow-2xl overflow-hidden
                      max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-amber-100 bg-amber-50 flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-100">
              {isEdit ? <Pencil size={16} className="text-amber-600" /> : <Plus size={16} className="text-amber-600" />}
            </span>
            <div>
              <h2 className="font-semibold text-gray-800 text-base">
                {isEdit ? 'Modifier le profil' : 'Ajouter un nouveau paramètre'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                NULL = hérite du seuil global par défaut
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nom de paramètre / ID
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                         text-gray-800 placeholder:text-gray-400 outline-none
                         focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
              placeholder="Ex : P-01, Profil Été, Zone montagneuse…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide -mb-2">Seuils d'alerte</p>

          {/* Temperature */}
          <MetricSection
            icon={Thermometer}
            colorClass="bg-red-50 text-red-500 border-red-100"
            title="Température"
            unit="°C"
            fields={[
              { key: 'ta', label: 'Attention (≥)',  value: tempAttention, onChange: setTempAttention },
              { key: 'tu', label: 'Urgente (≥)',    value: tempUrgente,   onChange: setTempUrgente   },
            ]}
          />

          {/* Humidity */}
          <MetricSection
            icon={Droplets}
            colorClass="bg-blue-50 text-blue-500 border-blue-100"
            title="Humidité"
            unit="%"
            fields={[
              { key: 'ha', label: 'Attention (≥)',  value: humAttention, onChange: setHumAttention },
              { key: 'hu', label: 'Urgente (≥)',    value: humUrgente,   onChange: setHumUrgente   },
            ]}
          />

          {/* Sound */}
          <MetricSection
            icon={Volume2}
            colorClass="bg-green-50 text-green-600 border-green-100"
            title="Sonore"
            unit="Hz"
            fields={[
              { key: 'sl', label: 'Alerte au-dessus de', value: soundLevel, onChange: setSoundLevel },
            ]}
          />

          {/* Battery + Weight in a row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-yellow-50 text-yellow-600 border-yellow-100">
                <span className="text-sm">🔋</span>
                <span className="text-sm font-semibold">Batterie</span>
              </div>
              <div className="px-4 py-3.5 bg-gray-50/40">
                <NumInput label="Alerte en dessous de" unit="V" value={batteryV} onChange={setBatteryV} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-purple-50 text-purple-600 border-purple-100">
                <span className="text-sm">⚖️</span>
                <span className="text-sm font-semibold">Poids (chute)</span>
              </div>
              <div className="px-4 py-3.5 bg-gray-50/40">
                <NumInput label="Perte max / 24h" unit="kg" value={weightDropKg} onChange={setWeightDropKg} placeholder="désactivé" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
            Annuler
          </button>
          <button
            onClick={() => isEdit ? onUpdate(profile.id, buildPayload()) : onCreate(buildPayload())}
            disabled={isBusy || !name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-white
                       hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default ThresholdProfileModal;