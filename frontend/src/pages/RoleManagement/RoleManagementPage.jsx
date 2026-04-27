// pages/RoleManagement/RoleManagementPage.jsx
//
// Superuser-only page: manage ALL users across ALL cooperatives.
// Users are grouped by their apiculteur (cooperative).
// Superuser can create/edit/delete any role: user, admin, superuser.
// Matches image 4 design.

import React, { useState, useMemo } from 'react';
import { Search, PlusCircle, Pencil, Trash2, UserCircle2, ChevronRight } from 'lucide-react';
import { HoneycombBottomRight } from '../Analytics/components/HoneycombDecor';
import { useUserList, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useApiculteurList } from '../../hooks/useApiculteurs';
import UserFormModal   from '../Settings/components/UserFormModal';
import DeleteUserModal from '../Settings/components/DeleteUserModal';

const ROLE_LABEL = {
  superuser: 'Super admin',
  admin    : 'Admin',
  user     : 'Utilisateur',
};

const RoleBadge = ({ role }) => {
  const colors = {
    superuser: 'text-purple-600 font-bold',
    admin    : 'text-amber-600 font-bold',
    user     : 'text-gray-700 font-semibold',
  };
  return (
    <span className={`text-sm capitalize ${colors[role] ?? 'text-gray-600'}`}>
      {ROLE_LABEL[role] ?? role}
    </span>
  );
};

const RoleManagementPage = () => {
  const { data: users       = [], isLoading: usersLoading  } = useUserList();
  const { data: apiculteurs = [], isLoading: apisLoading   } = useApiculteurList();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [search,      setSearch]     = useState('');
  const [roleFilter,  setRoleFilter] = useState('');
  const [modal,       setModal]      = useState(null);
  const [targetUser,  setTargetUser] = useState(null);

  const openAdd    = ()     => { setTargetUser(null); setModal('add');    };
  const openEdit   = (user) => { setTargetUser(user); setModal('edit');   };
  const openDelete = (user) => { setTargetUser(user); setModal('delete'); };
  const close      = ()     => { setModal(null); setTargetUser(null);     };

  const handleCreate = (data) => createMutation.mutate(data,                    { onSuccess: close });
  const handleUpdate = (data) => updateMutation.mutate({ id: targetUser.id, data }, { onSuccess: close });
  const handleDelete = ()     => deleteMutation.mutate(targetUser.id,            { onSuccess: close });

  // Group users by apiculteur_id — superusers (apiculteur_id=null) get their own group
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filteredUsers = users.filter(u => {
      const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
      const matchRole   = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });

    // Build groups: one per apiculteur + one for superusers (null apiculteur)
    const groups = {};

    // Add all apiculteurs as groups (even empty ones)
    apiculteurs.forEach(a => {
      groups[a.id] = { apiculteur: a, users: [] };
    });

    // Special group for platform-level superusers
    groups['__platform__'] = { apiculteur: null, users: [] };

    filteredUsers.forEach(u => {
      const key = u.apiculteur_id ?? '__platform__';
      if (!groups[key]) groups[key] = { apiculteur: null, users: [] };
      groups[key].users.push(u);
    });

    // Remove empty groups (except platform)
    return Object.values(groups).filter(g => g.users.length > 0 || g.apiculteur !== null);
  }, [users, apiculteurs, search, roleFilter]);

  const isLoading = usersLoading || apisLoading;

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#FDFAF4' }}>
      <HoneycombBottomRight />

      <div className="relative z-10 p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des comptes</h1>
            <p className="text-sm text-gray-400 mt-1">Gérez les accès et les rôles de l'équipe.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="relative flex max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Entreprise/User/mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-lg h-10 pl-9 pr-4 border border-gray-200 rounded-xl text-sm
                         bg-white text-gray-700 focus:outline-none focus:border-amber-400 transition"
            />
            <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white
                       text-gray-600 focus:outline-none focus:border-amber-400"
          >
            <option value="">Rôle</option>
            <option value="superuser">Super admin</option>
            <option value="admin">Admin</option>
            <option value="user">Utilisateur</option>
          </select>
          </div>
          

          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600
                       text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Ajouter un Compte
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3
                        text-[11px] font-semibold uppercase tracking-wider text-gray-400
                        border-b border-gray-200 mb-2">
          <span>Utilisateurs</span>
          <span>Rôle</span>
          <span>Date de création</span>
          <span>Connexion</span>
          <span>Engagement</span>
          <span>Actions</span>
        </div>

        {/* Groups */}
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse mb-4" />
          ))
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          grouped.map((group, gi) => {
            if (!group.apiculteur && group.users.length === 0) return null;
            const a = group.apiculteur;

            return (
              <div key={a?.id ?? '__platform__'} className="mb-4">
                {/* Group header — apiculteur row */}
                <div className="flex items-center justify-between px-6 py-3
                                bg-gray-50 rounded-t-2xl border border-gray-100 border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {a ? a.company_name : 'AGRI4.0 — Superutilisateurs'}
                      </p>
                      <p className="text-xs text-gray-400">{a?.email ?? ''}</p>
                    </div>
                  </div>
                  {a && (
                    <button className="flex items-center gap-1 text-xs text-gray-400
                                       hover:text-amber-600 transition-colors">
                      Détails <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Users in this group */}
                <div className="border border-gray-100 border-t-0 rounded-b-2xl divide-y divide-gray-50 bg-white">
                  {group.users.length === 0 ? (
                    <div className="px-6 py-4 text-sm text-gray-300 italic">
                      Aucun utilisateur dans cette coopérative.
                    </div>
                  ) : (
                    group.users.map(user => (
                      <div key={user.id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4
                                   items-center px-6 py-3 hover:bg-gray-50 transition-colors">
                        {/* User info */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <UserCircle2 className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {user.full_name || 'User name'}
                            </p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>

                        <RoleBadge role={user.role} />

                        <span className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </span>

                        {/* login_count — green if > 0 */}
                        <span className={`text-sm font-semibold
                          ${(user.login_count ?? 0) > 0 ? 'text-green-500' : 'text-gray-300'}`}>
                          {user.login_count ?? 0}
                        </span>

                        {/* last_login_at as engagement indicator */}
                        <span className="text-sm font-semibold text-green-500">
                          {user.last_login_at
                            ? (() => {
                                const mins = Math.round((Date.now() - new Date(user.last_login_at)) / 60000);
                                return mins < 60 ? `${mins}min` : `${Math.round(mins/60)}h`;
                              })()
                            : '—'}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(user)}
                            className="text-gray-300 hover:text-gray-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(user)}
                            className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <UserFormModal
          user        = {modal === 'edit' ? targetUser : null}
          onClose     = {close}
          onSubmit    = {modal === 'add' ? handleCreate : handleUpdate}
          isSubmitting= {modal === 'add' ? createMutation.isPending : updateMutation.isPending}
          allowedRoles= {['user', 'admin', 'superuser']}
          apiculteurs = {apiculteurs}
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

export default RoleManagementPage;