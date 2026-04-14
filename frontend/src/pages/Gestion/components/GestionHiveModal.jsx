import { useEffect, useState } from 'react';

const GestionHiveModal = ({
  modal,
  onClose,
  onCreate,
  onToggle,
  onDelete,
  creating,
  updating,
  deleting,
}) => {
  const { type, hive } = modal;

  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (type === 'settings' && hive) {
      setEnabled(hive.is_active ?? true);
    }
    if (type === 'create') {
      setName('');
    }
  }, [type, hive]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-[420px]">

        {/* CREATE */}
        {type === 'create' && (
          <>
            <h2 className="mb-4 font-semibold">Ajouter une ruche</h2>

            <input
              className="w-full border p-2 rounded mb-4"
              placeholder="Nom de la ruche"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button onClick={onClose}>Annuler</button>

              <button
                onClick={() => onCreate({ name })}
                disabled={creating}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                {creating ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </>
        )}

        {/* SETTINGS */}
        {type === 'settings' && hive && (
          <>
            <h2 className="mb-4 font-semibold">
              Paramètres — {hive.name}
            </h2>

            <div className="flex justify-between items-center mb-6">
              <span>Transmission active</span>

              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  const value = e.target.checked;
                  setEnabled(value);
                  onToggle(hive, value);
                }}
              />
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 py-2 rounded"
            >
              Fermer
            </button>
          </>
        )}

        {/* DELETE */}
        {type === 'delete' && hive && (
          <>
            <h2 className="text-red-600 font-semibold mb-3">
              Supprimer la ruche
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold">{hive.name}</span> ?
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={onClose}>Annuler</button>

              <button
                onClick={() => onDelete(hive)}
                disabled={deleting}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GestionHiveModal;