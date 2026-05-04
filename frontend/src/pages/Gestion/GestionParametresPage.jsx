// src/pages/Gestion/GestionParametresPage.jsx

import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2,
  CheckCircle2, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useGestionHives }      from './hooks/useGestionHives';
import { useThresholdProfiles } from './hooks/useThresholdProfiles';
import ThresholdProfileModal    from './components/ThresholdProfileModal';

/* ── Tab button ──────────────────────────────────────────────────────────── */
const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-xl text-sm font-medium transition
      ${active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
  >
    {children}
  </button>
);

/* ── Format threshold value for display ─────────────────────────────────── */
const val = (v, unit) => v != null ? `${v}${unit}` : <span className="text-gray-300">—</span>;

/* ── Skeleton row ────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <div className="h-16 border-b border-gray-50 animate-pulse bg-gray-50/60" />
);

/* ── Bee SVG (shared with HiveCard) ─────────────────────────────────────── */
const BeeSVG = () => (
  <svg height="56px" width="56px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M201.905,145.195c0,13.862,5.214,26.498,13.785,36.064h80.619c8.571-9.566,13.789-22.202,13.789-36.064c0-18.74-9.538-35.252-24.017-44.965l8.256-16.862c2.814-0.448,5.376-2.201,6.721-4.948c2.186-4.471,0.336-9.874-4.138-12.061c-4.472-2.194-9.875-0.344-12.058,4.134c-1.584,3.231-1.048,6.932,1.052,9.573l-7.73,15.797c-6.77-3.048-14.276-4.758-22.181-4.758c-7.912,0-15.415,1.71-22.188,4.758l-7.726-15.797c2.099-2.642,2.635-6.342,1.055-9.573c-2.19-4.478-7.59-6.328-12.061-4.134c-4.475,2.187-6.329,7.59-4.138,12.061c1.346,2.747,3.907,4.5,6.721,4.948l8.256,16.862C211.436,109.943,201.905,126.455,201.905,145.195z"/>
      <path d="M182.52,210.456c20.608-10.302,14.805-25.188,5.354-35.63C163.402,147.774,78.392,98.828,33.97,91.105C21.282,88.89-6.387,90.243,1.34,129.749c2.663,13.61,21.47,73.838,62.686,94.457C105.24,244.803,164.972,219.23,182.52,210.456z"/>
      <path d="M203.475,211.941c-4.394,4.219-10.004,7.443-15.194,10.036c-10.761,5.382-48.862,22.932-87.386,22.932c-3.413,0-6.732-0.168-9.987-0.442c-21.442,22.756-28.973,53.55-17.44,73.328c12.026,20.611,47.33,26.505,72.991,10.302c32.63-20.604,52.804-80.721,56.241-97.884C203.678,225.313,205.567,215.249,203.475,211.941z"/>
      <path d="M478.03,91.105c-44.422,7.723-129.432,56.669-153.905,83.72c-9.447,10.442-15.253,25.328,5.351,35.63c17.549,8.774,77.284,34.347,118.499,13.75c41.219-20.619,60.022-80.847,62.685-94.457C518.387,90.243,490.719,88.89,478.03,91.105z"/>
      <path d="M411.101,244.908c-38.52,0-76.621-17.549-87.382-22.932c-5.186-2.593-10.804-5.816-15.194-10.036c-2.092,3.308-0.207,13.372,0.774,18.271c3.434,17.163,23.614,77.28,56.241,97.884c25.657,16.203,60.964,10.309,72.987-10.302c11.535-19.778,4.005-50.572-17.437-73.328C417.836,244.74,414.518,244.908,411.101,244.908z"/>
      <path d="M293.997,191.562h-75.994c-2.846,0-5.155,2.312-5.155,5.158v32.841c0,2.846,2.309,5.158,5.155,5.158h75.994c2.842,0,5.151-2.312,5.151-5.158v-32.841C299.148,193.874,296.839,191.562,293.997,191.562z"/>
      <path d="M217.351,246.954c-3.346,3.182-13.729,19-20.734,39.926h118.766c-7.005-20.927-17.388-36.744-20.734-39.926H217.351z"/>
      <path d="M190.506,313.925c-0.869,7.842-0.925,15.916,0.214,23.948c0.816,5.746,2.011,11.052,3.48,15.986h123.608c1.472-4.934,2.66-10.239,3.473-15.986c1.139-8.032,1.083-16.105,0.214-23.948H190.506z"/>
      <path d="M249.726,412.356l4.692,31.67c0.217,1.458,1.472,2.538,2.95,2.538c1.479,0,2.737-1.079,2.95-2.538l4.846-32.721c10.169-3.904,26.824-12.573,39.582-30.402h-97.481C221.325,400.533,240.1,409.076,249.726,412.356z"/>
    </g>
  </svg>
);

/* ════════════════════════════════════════════════════════════════════════════
   TAB 1 — PROFILES LIST
   ════════════════════════════════════════════════════════════════════════════ */
const ProfilesTab = ({ profiles, isLoading, onAdd, onEdit, onDelete, search, setSearch }) => (
  <div className="flex flex-col gap-5">
    {/* Toolbar */}
    <div className="flex items-center gap-4 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-xs  bg-white">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cherche…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm
                     placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
        />
      </div>
      <span className="text-xs text-gray-400">Les paramètres Enregistrer : {profiles.length}</span>
      <button
        onClick={onAdd}
        className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-white
                   text-sm font-semibold hover:bg-amber-500 transition"
      >
        <Plus size={15} />
        Ajouter un paramètre
      </button>
    </div>

    {/* Table */}
    <div className="rounded-2xl border border-gray-100 overflow-hidden  bg-white">
      <div className="grid grid-cols-[200px_1fr_1fr_1fr_72px] bg-gray-50 border-b border-gray-100 px-5 py-3">
        {['Ruches ID', 'Température', 'Humidité', 'Sonore', ''].map((h) => (
          <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</span>
        ))}
      </div>

      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        : profiles.length === 0
          ? (
            <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
              <AlertTriangle size={24} className="text-gray-200" />
              <p className="text-sm">Aucun profil. Cliquez sur « Ajouter un paramètre ».</p>
            </div>
          )
          : profiles.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[200px_1fr_1fr_1fr_72px] items-center px-5 py-4
                           border-b border-gray-50 hover:bg-gray-50/60 transition group"
              >
                {/* Name + date */}
                <div>
                  <p className="text-sm font-bold text-gray-800">{p.name}</p>
                  {p.created_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                {/* Temp */}
                <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                  <span>Att: {val(p.temp_attention, '°C')}  Urg: {val(p.temp_urgente, '°C')}</span>
                </div>

                {/* Humidity */}
                <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                  <span>Att: {val(p.hum_attention, '%')}  Urg: {val(p.hum_urgente, '%')}</span>
                </div>

                {/* Sound */}
                <div className="text-xs text-gray-600">
                  {val(p.sound_level, 'Hz')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
      }
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   TAB 2 — HIVES ASSIGNMENT
   ════════════════════════════════════════════════════════════════════════════ */
const HivesTab = ({ hives, hivesLoading, profiles, onAssign, onUnassign, assigning }) => {
  const [search,          setSearch]          = useState('');
  const [selectedHiveIds, setSelectedHiveIds] = useState(new Set());
  const [panelSearch,     setPanelSearch]     = useState('');

  const filtered = useMemo(
    () => hives.filter((h) => h.name?.toLowerCase().includes(search.toLowerCase())),
    [hives, search]
  );

  const panelProfiles = useMemo(
    () => profiles.filter((p) => p.name?.toLowerCase().includes(panelSearch.toLowerCase())),
    [profiles, panelSearch]
  );

  const toggleHive = (id) =>
    setSelectedHiveIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = filtered.length > 0 && selectedHiveIds.size === filtered.length;

  const toggleAll = () =>
    setSelectedHiveIds(allSelected ? new Set() : new Set(filtered.map((h) => h.id)));

  return (
    <div className="flex gap-6 ">
      {/* ── Hive grid ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cherche…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm
                         placeholder:text-gray-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
            />
          </div>
          <button
            onClick={toggleAll}
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition ml-auto"
          >
            {allSelected ? 'Désélectionner tous' : 'Sélectionner tous'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {hivesLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            : filtered.map((hive) => {
                const selected = selectedHiveIds.has(hive.id);
                const assignedProfile = profiles.find((p) => p.id === hive.threshold_profile_id);
                return (
                  <button
                    key={hive.id}
                    onClick={() => toggleHive(hive.id)}
                    className={`relative rounded-2xl border-2 overflow-hidden text-left transition
                      ${selected
                        ? 'border-amber-400 shadow-md shadow-amber-100/60'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center transition
                      ${selected ? 'bg-amber-400 border-amber-400' : 'bg-white border-gray-300'}`}>
                      {selected && <CheckCircle2 size={13} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* Profile badge */}
                    {assignedProfile && (
                      <div className="absolute top-2.5 right-2.5 z-10 bg-amber-400 text-white
                                      text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-tight">
                        {assignedProfile.name}
                      </div>
                    )}

                    {/* Bee */}
                    <div className="bg-orange-50 flex items-center justify-center pt-8 pb-3">
                      <BeeSVG />
                    </div>
                    <div className="h-1.5 bg-gray-900" />

                    {/* Footer */}
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{hive.name}</span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </div>
                  </button>
                );
              })
          }
        </div>

        {selectedHiveIds.size > 0 && (
          <p className="text-xs text-amber-600 font-medium">
            {selectedHiveIds.size} ruche{selectedHiveIds.size > 1 ? 's' : ''} sélectionnée{selectedHiveIds.size > 1 ? 's' : ''}
            {' '}— sélectionnez un profil à droite pour l'appliquer
          </p>
        )}
      </div>

      {/* ── Profiles panel ─────────────────────────────────────────────── */}
      <div className="w-[220px] flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Paramètre</h3>
          <span className="text-xs text-gray-400">Total : {profiles.length}</span>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            placeholder="Cherche…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm
                       placeholder:text-gray-300 outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {panelProfiles.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">
              Aucun profil. Créez-en un dans l'onglet Paramètre.
            </p>
          )}

          {panelProfiles.map((profile) => {
            const assignedCount = hives.filter((h) => h.threshold_profile_id === profile.id).length;
            const willAssign    = selectedHiveIds.size > 0;

            return (
              <div key={profile.id} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Profile header */}
                <div className="px-3 py-2.5 bg-gray-50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{profile.name}</p>
                    {assignedCount > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {assignedCount} ruche{assignedCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Apply / Remove button */}
                <button
                  onClick={() => {
                    if (!willAssign) return;
                    // If all selected hives already use this profile → remove; else assign
                    const allUseThis = [...selectedHiveIds].every(
                      (id) => hives.find((h) => h.id === id)?.threshold_profile_id === profile.id
                    );
                    allUseThis
                      ? onUnassign(profile.id, [...selectedHiveIds])
                      : onAssign(profile.id, [...selectedHiveIds]);
                  }}
                  disabled={assigning || !willAssign}
                  className={`w-full py-2 text-xs font-semibold transition
                    ${!willAssign
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                    }`}
                >
                  {assigning ? '…' : !willAssign ? 'Sélectionnez des ruches' : 'Appliquer'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const GestionParametresPage = () => {
  const { apiculteurId }         = useParams();
  const numId                    = Number(apiculteurId);

  const [activeTab,     setActiveTab]     = useState('profiles');
  const [profileSearch, setProfileSearch] = useState('');

  const { hives, isLoading: hivesLoading } = useGestionHives(numId);

  const {
    profiles,
    isLoading: profilesLoading,
    modal,
    openCreate, openEdit, openDelete, closeModal,
    handleCreate, handleUpdate, handleDelete,
    handleAssign, handleUnassign,
    creating, updating, deleting, assigning,
  } = useThresholdProfiles(numId);

  const filteredProfiles = useMemo(
    () => profiles.filter((p) =>
      p.name?.toLowerCase().includes(profileSearch.toLowerCase())
    ),
    [profiles, profileSearch]
  );

  return (
    <div className="p-6 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des paramètres</h1>
        <p className="text-sm text-gray-400 mt-1">
          Personnalisation précise et contrôle global des ruches
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
        <Tab active={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')}>Paramètre</Tab>
        <Tab active={activeTab === 'hives'}    onClick={() => setActiveTab('hives')}>Ruches</Tab>
      </div>

      {activeTab === 'profiles' && (
        <ProfilesTab
          profiles={filteredProfiles}
          isLoading={profilesLoading}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={openDelete}
          search={profileSearch}
          setSearch={setProfileSearch}
        />
      )}

      {activeTab === 'hives' && (
        <HivesTab
          hives={hives}
          hivesLoading={hivesLoading}
          profiles={profiles}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          assigning={assigning}
        />
      )}

      <ThresholdProfileModal
        modal={modal}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        creating={creating}
        updating={updating}
        deleting={deleting}
      />
    </div>
  );
};

export default GestionParametresPage;