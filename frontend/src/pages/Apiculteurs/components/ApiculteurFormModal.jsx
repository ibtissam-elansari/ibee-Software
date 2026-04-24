import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';

const REGIONS = [
  'Souss-Massa', 'Marrakech-Safi', 'Drâa-Tafilalet', 'Fès-Meknès',
  'Rabat-Salé-Kénitra', 'Béni Mellal-Khénifra', 'Casablanca-Settat',
  'Tanger-Tétouan-Al Hoceïma', 'L\'Oriental', 'Guelmim-Oued Noun',
  'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab',
];

const ApiculteurFormModal = ({
  mode = 'add',
  initialData = null,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) => {
  const isEdit = mode === 'edit';

  const [companyName,  setCompanyName]  = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [phone,        setPhone]        = useState('');
  const [region,       setRegion]       = useState('');
  const [city,         setCity]         = useState('');
  const [address,      setAddress]      = useState('');
  const [hiveCount,    setHiveCount]    = useState(0);

  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.company_name ?? '');
      setEmail(initialData.email ?? '');
      setPhone(initialData.phone ?? '');
      setRegion(initialData.region ?? '');
      setCity(initialData.city ?? '');
      setAddress(initialData.address ?? '');
      setHiveCount(initialData.initial_hive_count ?? 0);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      company_name       : companyName,
      email,
      phone              : phone || null,
      region             : region || null,
      city               : city   || null,
      address            : address || null,
      initial_hive_count : Number(hiveCount),
    };
    if (!isEdit) data.password = password;
    onSubmit(data);
  };

  const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
    text-gray-800 placeholder:text-gray-300 bg-white
    focus:outline-none focus:border-amber-400 transition-colors`;

  const labelCls = 'text-sm font-medium text-gray-800 block mb-1.5';

  const valid = companyName.trim() && email.trim() && (!isEdit ? password.length >= 6 : true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Profil du Apiculteurs' : 'Ajouter un Apiculteur'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-7 flex flex-col gap-5">

          {/* Photo de profil */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200
                            flex items-center justify-center text-gray-300 flex-shrink-0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Photo de profil</p>
              <p className="text-xs text-gray-400 mb-2">JPG, PNG. Max 5MB.</p>
              <button type="button"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gray-200
                           text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Télécharger
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Nom complet */}
          <div>
            <label className={labelCls}>Nom complet</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="Agri40" required className={inputCls} />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="agri40@exemple.com" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Numéro de téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+212 600000000" className={inputCls} />
            </div>
          </div>

          {/* Password (create only) */}
          {!isEdit && (
            <div>
              <label className={labelCls}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 caractères" required minLength={6} className={inputCls} />
            </div>
          )}

          {/* Section title */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Localisation et Exploitation
            </h3>
            <div className="h-px bg-gray-100" />
          </div>

          {/* Région + Ville */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Région</label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className={inputCls + ' cursor-pointer'}>
                <option value="">Sélectionner...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ville / Commune</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="Agadir" className={inputCls} />
            </div>
          </div>

          {/* Adresse complète */}
          <div>
            <label className={labelCls}>Adresse complète</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Quartier Rural, Drarga, Agadir, 80045" className={inputCls} />
          </div>

          {/* Nombre de ruches initial */}
          <div>
            <label className={labelCls}>Nombre de ruches initial</label>
            <input type="number" min={0} value={hiveCount}
              onChange={e => setHiveCount(e.target.value)} className={inputCls} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
              {error.response?.data?.detail ?? 'Une erreur est survenue'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-8 py-2.5 rounded-xl bg-gray-200 text-gray-600 text-sm
                         font-semibold hover:bg-gray-300 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={!valid || isSubmitting}
              className="px-8 py-2.5 rounded-xl text-white text-sm font-semibold
                         disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F5A623' }}>
              {isSubmitting ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiculteurFormModal;