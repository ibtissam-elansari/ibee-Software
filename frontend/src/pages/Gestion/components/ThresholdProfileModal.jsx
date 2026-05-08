import { useEffect, useState } from 'react';
import { X, Plus, Pencil, Trash2, Thermometer, Droplets, Volume2, BatteryLow, Weight } from 'lucide-react';

/* ── shared primitives ───────────────────────────────────────────────────── */

const Backdrop = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

const NumInput = ({ label, value, onChange, unit, placeholder = '—' }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2
                    focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full min-w-0 text-sm text-gray-800 outline-none bg-transparent"
      />
      {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, colorClass, title, hint }) => (
  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${colorClass}`}>
    <div className="flex items-center gap-2">
      <Icon size={14} />
      <span className="text-sm font-semibold">{title}</span>
    </div>
    {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
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

  /* ── local state — one field per HiveThreshold column ── */
  const [name,           setName]           = useState('');
  const [tempAttention,  setTempAttention]  = useState(null);
  const [tempUrgente,    setTempUrgente]    = useState(null);
  const [humAttention,   setHumAttention]   = useState(null);
  const [humUrgente,     setHumUrgente]     = useState(null);
  const [batteryV,       setBatteryV]       = useState(null);
  const [soundLevel,     setSoundLevel]     = useState(null);
  const [weightDropKg,   setWeightDropKg]   = useState(null);

  useEffect(() => {
    if (type === 'edit' && profile) {
      setName(profile.name ?? '');
      setTempAttention(profile.temp_attention ?? null);
      setTempUrgente(profile.temp_urgente ?? null);
      setHumAttention(profile.hum_attention ?? null);
      setHumUrgente(profile.hum_urgente ?? null);
      setBatteryV(profile.battery_v ?? null);
      setSoundLevel(profile.sound_level ?? null);
      setWeightDropKg(profile.weight_drop_kg ?? null);
    } else {
      setName('');
      setTempAttention(null); setTempUrgente(null);
      setHumAttention(null);  setHumUrgente(null);
      setBatteryV(null);      setSoundLevel(null);
      setWeightDropKg(null);
    }
  }, [type, profile]);

  const buildPayload = () => ({
    name,
    temp_attention : tempAttention,
    temp_urgente   : tempUrgente,
    hum_attention  : humAttention,
    hum_urgente    : humUrgente,
    battery_v      : batteryV,
    sound_level    : soundLevel,
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
              <p className="text-xs text-gray-500 mt-0.5">Les ruches concernées reviendront aux seuils globaux</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer{' '}
            <span className="font-semibold text-gray-800">«&nbsp;{profile.name}&nbsp;»</span> ?
            Les ruches assignées à ce profil conserveront leurs seuils actuels mais ne seront
            plus liées à un profil.
          </p>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">Annuler</button>
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
  const isPending = isEdit ? updating : creating;

  return (
    <Backdrop onClose={onClose}>
      <div className="relative w-[560px] max-w-full rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

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
              <h2 className="font-semibold text-gray-800">
                {isEdit ? 'Modifier le profil' : 'Ajouter un nouveau paramètre'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Les champs vides conservent les valeurs globales par défaut
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nom du profil / ID
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                         text-gray-800 placeholder:text-gray-400 outline-none
                         focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
              placeholder="Ex : Profil Été, Ruche de production, Zone montagneuse…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* ── Température ── */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <SectionHeader
              icon={Thermometer}
              colorClass="bg-red-50 text-red-500 border-red-100"
              title="Température"
              hint="Défaut : attention 35 °C · urgente 40 °C"
            />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-gray-50/40">
              <NumInput label="Seuil Attention"  value={tempAttention} onChange={setTempAttention} unit="°C" placeholder="35" />
              <NumInput label="Seuil Urgente"    value={tempUrgente}   onChange={setTempUrgente}   unit="°C" placeholder="40" />
            </div>
          </div>

          {/* ── Humidité ── */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <SectionHeader
              icon={Droplets}
              colorClass="bg-blue-50 text-blue-500 border-blue-100"
              title="Humidité"
              hint="Défaut : attention 70 % · urgente 80 %"
            />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-gray-50/40">
              <NumInput label="Seuil Attention"  value={humAttention} onChange={setHumAttention} unit="%" placeholder="70" />
              <NumInput label="Seuil Urgente"    value={humUrgente}   onChange={setHumUrgente}   unit="%" placeholder="80" />
            </div>
          </div>

          {/* ── Sonore ── */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <SectionHeader
              icon={Volume2}
              colorClass="bg-green-50 text-green-600 border-green-100"
              title="Sonore"
              hint="Défaut : alerte > 80"
            />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-gray-50/40">
              <NumInput label="Seuil Alerte"  value={soundLevel} onChange={setSoundLevel} unit="Hz" placeholder="80" />
              <div /> {/* spacer — only one threshold for sound */}
            </div>
          </div>

          {/* ── Batterie ── */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <SectionHeader
              icon={BatteryLow}
              colorClass="bg-orange-50 text-orange-500 border-orange-100"
              title="Batterie"
              hint="Défaut : alerte ≤ 3.5 V"
            />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-gray-50/40">
              <NumInput label="Alerte en-dessous de"  value={batteryV} onChange={setBatteryV} unit="V" placeholder="3.5" />
              <div />
            </div>
          </div>

          {/* ── Poids ── */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <SectionHeader
              icon={Weight}
              colorClass="bg-purple-50 text-purple-500 border-purple-100"
              title="Poids (chute sur 24 h)"
              hint="Laisser vide = désactivé"
            />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 bg-gray-50/40">
              <NumInput label="Chute max autorisée"  value={weightDropKg} onChange={setWeightDropKg} unit="kg" placeholder="désactivé" />
              <div />
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
            disabled={isPending || !name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-white
                       hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isEdit
              ? (updating ? 'Enregistrement…' : 'Enregistrer')
              : (creating ? 'Ajout…'           : 'Ajouter')}
          </button>
        </div>
      </div>
    </Backdrop>
  );
};

export default ThresholdProfileModal;