import { useEffect, useState } from 'react';
import { X, MapPin, Hash, ToggleLeft, ToggleRight, Trash2, Plus } from 'lucide-react';

/* ─── Reusable toggle switch ─────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`
      relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
      transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
      ${checked ? 'bg-amber-400' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md
        transform transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

/* ─── Labelled input ─────────────────────────────────────────────────────── */
const Field = ({ icon: Icon, label, placeholder, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      <input
        className={`
          w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm text-gray-800
          placeholder:text-gray-400 outline-none
          focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition
          ${Icon ? 'pl-9 pr-3' : 'px-3'}
        `}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

/* ─── Backdrop ───────────────────────────────────────────────────────────── */
const Backdrop = ({ onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

/* ─── Modal shell ────────────────────────────────────────────────────────── */
const ModalShell = ({ onClose, children }) => (
  <div className="relative w-[440px] max-w-full rounded-2xl bg-white shadow-2xl overflow-hidden">
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
    >
      <X size={16} />
    </button>
    {children}
  </div>
);

/* ─── Section header stripe ──────────────────────────────────────────────── */
const ModalHeader = ({ color = 'amber', icon: Icon, title, subtitle }) => {
  const colors = {
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    red:   'bg-red-50   border-red-100   text-red-500',
  };
  return (
    <div className={`px-6 pt-6 pb-4 border-b ${colors[color]}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={`p-2 rounded-xl ${color === 'amber' ? 'bg-amber-100' : 'bg-red-100'}`}>
            <Icon size={18} />
          </span>
        )}
        <div>
          <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */
const GestionHiveModal = ({
  modal,
  onClose,
  onCreate,
  onToggle,
  onUpdate,
  onDelete,
  creating,
  updating,
  deleting,
}) => {
  if (!modal) return null;
  const { type, hive } = modal;

  const [name, setName]           = useState('');
  const [location, setLocation]   = useState('');
  const [enabled, setEnabled]     = useState(true);

  useEffect(() => {
    if (type === 'settings' && hive) {
      setName(hive.name ?? '');
      setLocation(hive.location_name ?? '');
      setEnabled(Boolean(hive.is_active));
    }
    if (type === 'create') {
      setName('');
      setLocation('');
    }
  }, [type, hive]);

  if (!type) return null;

  /* ── helpers ── */
  const handleToggleChange = (value) => {
    setEnabled(value);          // just update local state, no API call
  };

  const handleSaveSettings = () => {
    onUpdate(hive, {
      name,
      location_name : location,
      is_active     : enabled,   // always include it
    });
  };

  /* ── CREATE ─────────────────────────────────────────────────────────────── */
  if (type === 'create') return (
    <Backdrop onClose={onClose}>
      <ModalShell onClose={onClose}>
        <ModalHeader
          color="amber"
          icon={Plus}
          title="Ajouter une ruche"
          subtitle="Renseignez les informations de base"
        />

        <div className="px-6 py-5 flex flex-col gap-4">
          <Field
            icon={Hash}
            label="Nom"
            placeholder="ex. Ruche du verger"
            value={name}
            onChange={setName}
          />
          <Field
            icon={MapPin}
            label="Emplacement"
            placeholder="ex. Jardin nord, parcelle B"
            value={location}
            onChange={setLocation}
          />
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onCreate({ name, location_name: location })}
            disabled={creating || !name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-white
                       hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creating ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </ModalShell>
    </Backdrop>
  );

  /* ── SETTINGS ────────────────────────────────────────────────────────────── */
  if (type === 'settings' && hive) return (
    <Backdrop onClose={onClose}>
      <ModalShell onClose={onClose}>
        <ModalHeader
          color="amber"
          icon={enabled ? ToggleRight : ToggleLeft}
          title={hive.name}
          subtitle="Paramètres de la ruche"
        />

        <div className="px-6 py-5 flex flex-col gap-4">
          <Field
            icon={Hash}
            label="Nom"
            placeholder="Nom de la ruche"
            value={name}
            onChange={setName}
          />
          <Field
            icon={MapPin}
            label="Emplacement"
            placeholder="Emplacement de la ruche"
            value={location}
            onChange={setLocation}
          />

          {/* Transmission toggle row */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Transmission active</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {enabled ? 'Les données sont transmises' : 'Transmission suspendue'}
              </p>
            </div>
            <Toggle
              checked={enabled}
              onChange={handleToggleChange}
              disabled={updating}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={updating || !name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-400 text-white
                       hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {updating ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </ModalShell>
    </Backdrop>
  );

  /* ── DELETE ──────────────────────────────────────────────────────────────── */
  if (type === 'delete' && hive) return (
    <Backdrop onClose={onClose}>
      <ModalShell onClose={onClose}>
        <ModalHeader
          color="red"
          icon={Trash2}
          title="Supprimer la ruche"
          subtitle="Cette action est irréversible"
        />

        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer{' '}
            <span className="font-semibold text-gray-800">«&nbsp;{hive.name}&nbsp;»</span>
            {hive.location_name && (
              <> <span className="text-gray-400">({hive.location_name})</span></>
            )}
            {' '}? Toutes ses données seront définitivement perdues.
          </p>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onDelete(hive)}
            disabled={deleting}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white
                       hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </ModalShell>
    </Backdrop>
  );

  return null;
};

export default GestionHiveModal;