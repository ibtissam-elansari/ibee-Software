// pages/Settings/AccountManagementPage.jsx
//
// Admin-only page: manage users within their own cooperative.
// Admin can create/edit/delete users with role = 'user' ONLY.
// The tab selector is hidden — admins only see 'Utilisateur' tab.
// Superusers use RoleManagementPage instead (grouped by apiculteur).

import React, { useState, useMemo } from 'react';
import { Search, PlusCircle, Pencil, Trash2, UserCircle2 } from 'lucide-react';
import {
  useUserList, useCreateUser, useUpdateUser, useDeleteUser,
} from '../../hooks/useUsers';
import useAuthStore  from '../../store/useAuthStore';
import UserFormModal from './components/UserFormModal';
import DeleteUserModal from './components/DeleteUserModal';
import PendingAccountsPanel from './components/PendingAccountsPanel';

const AccountManagementPage = () => {
  const currentUser = useAuthStore(s => s.user);

  // Admin only sees users from their own coop — backend already filters by role
  const { data: allUsers = [], isLoading } = useUserList();

  // Admin can only manage 'user' role — filter out admins and superusers
  const users = useMemo(() =>
    allUsers.filter(u =>
      u.role === 'user' &&
      u.apiculteur_id === currentUser?.apiculteur_id
    ),
    [allUsers, currentUser]
  );

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null); // 'add' | 'edit' | 'delete'
  const [targetUser,  setTargetUser]  = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u =>
      !q || u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const openAdd    = ()     => { setTargetUser(null);  setModal('add');    };
  const openEdit   = (user) => { setTargetUser(user);  setModal('edit');   };
  const openDelete = (user) => { setTargetUser(user);  setModal('delete'); };
  const close      = ()     => { setModal(null); setTargetUser(null);      };

  const handleCreate = (data) =>
    createMutation.mutate(
      { ...data, role: 'user', apiculteur_id: currentUser?.apiculteur_id },
      { onSuccess: close }
    );

  const handleUpdate = (data) =>
    updateMutation.mutate({ id: targetUser.id, data }, { onSuccess: close });

  const handleDelete = () =>
    deleteMutation.mutate(targetUser.id, { onSuccess: close });

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#FDFAF4' }}>

      <div className="relative z-10 p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des comptes</h1>
            <p className="text-sm text-gray-400 mt-1">Gérez les accès et les rôles de l'équipe.</p>
          </div>
        </div>
      <PendingAccountsPanel/>
      <div className='flex justify-between'>
        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="User name/mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-xl text-sm
                       bg-white text-gray-700 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 h-10 bg-amber-500 hover:bg-amber-600
                       text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Ajouter un Compte
          </button>
      </div>


        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Utilisateurs
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Rôle
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Date de création
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucun utilisateur dans cette catégorie.
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircle2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {user.full_name || 'User name'}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 capitalize">
                      Utilisateur
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-gray-300 hover:text-gray-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(user)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <UserFormModal
          user        = {modal === 'edit' ? targetUser : null}
          onClose     = {close}
          onSubmit    = {modal === 'add' ? handleCreate : handleUpdate}
          isSubmitting= {modal === 'add' ? createMutation.isPending : updateMutation.isPending}
          // Admin can only assign 'user' role
          allowedRoles= {['user']}
        />
      )}
      {modal === 'delete' && (
        <DeleteUserModal
          user        = {targetUser}
          onClose     = {close}
          onConfirm   = {handleDelete}
          isSubmitting= {deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default AccountManagementPage;