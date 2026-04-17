import React, { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useUserList,
  useCurrentUserRole,
  useCurrentUser,
  canManage,
  assignableRoles,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '../../../hooks/useUsers';
import UserFormModal from './UserFormModal';
import DeleteUserModal from './DeleteUserModal';

const ROLE_TABS = [
  { key: 'superuser', label: 'Super admin' },
  { key: 'admin',     label: 'Admin'       },
  { key: 'user',      label: 'Utilisateur' },
];

const ROLE_DISPLAY = {
  superuser: 'Super admin',
  admin    : 'Admin',
  user     : 'Utilisateur',
};

const AccountManagementPanel = () => {
  const { data: users = [], isLoading } = useUserList();
  const actorRole   = useCurrentUserRole();
  const currentUser = useCurrentUser();
  const allowed     = assignableRoles(actorRole);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [activeTab, setActiveTab] = useState('superuser');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null); // 'create' | 'edit' | 'delete'
  const [targetUser, setTarget]   = useState(null);

  const openCreate = ()  => { setTarget(null); setModal('create'); };
  const openEdit   = (u) => { setTarget(u);    setModal('edit');   };
  const openDelete = (u) => { setTarget(u);    setModal('delete'); };
  const closeModal = ()  => { setModal(null);  setTarget(null);    };

  const submitCreate = (data) =>
    createMutation.mutate(data, { onSuccess: closeModal });

  const submitEdit = (data) =>
    updateMutation.mutate(
      { id: targetUser.id, data },
      { onSuccess: closeModal }
    );

  const submitDelete = () =>
    deleteMutation.mutate(targetUser.id, { onSuccess: closeModal });

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchTab    = u.role === activeTab;
      const matchSearch = !q || u.email.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [users, activeTab, search]);

  const canCreate = actorRole === 'admin' || actorRole === 'superuser';

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gestion des comptes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Gérez les accès et les rôles de l'équipe.
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === tab.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="User name/mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-gray-200 rounded-xl
                         text-sm text-gray-700 placeholder:text-gray-300
                         focus:outline-none focus:border-amber-400 transition-colors bg-white"
            />
          </div>

          {canCreate && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm
                         font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{ backgroundColor: '#F5A623' }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Ajouter un Compte
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['Utilisateurs', 'Role', 'Date de creation', 'Actions'].map(col => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase
                               tracking-[0.1em] text-gray-400 border-b border-gray-100"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[0, 1, 2, 3].map(j => (
                      <td key={j} className="px-3 py-3.5 border-b border-gray-50">
                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-sm text-gray-400">
                    Aucun utilisateur dans cette catégorie.
                  </td>
                </tr>
              ) : (
                filtered.map(user => {
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100
                                          flex items-center justify-center text-purple-400 text-xs font-bold">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.name ?? user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-700">
                        {ROLE_DISPLAY[user.role] ?? user.role}
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3.5 text-sm text-gray-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5">
                        {canManage(actorRole, user.role) && !isSelf ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEdit(user)}
                              className="text-gray-400 hover:text-amber-500"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openDelete(user)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-200 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <UserFormModal
          mode="create"
          allowedRoles={allowed}
          onSubmit={submitCreate}
          onClose={closeModal}
          isSubmitting={createMutation.isPending}
          error={createMutation.error}
        />
      )}

      {modal === 'edit' && (
        <UserFormModal
          mode="edit"
          initialData={targetUser}
          allowedRoles={allowed}
          onSubmit={submitEdit}
          onClose={closeModal}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error}
        />
      )}

      {modal === 'delete' && (
        <DeleteUserModal
          user={targetUser}
          onConfirm={submitDelete}
          onClose={closeModal}
          isSubmitting={deleteMutation.isPending}
          error={deleteMutation.error}
        />
      )}
    </>
  );
};

export default AccountManagementPanel;