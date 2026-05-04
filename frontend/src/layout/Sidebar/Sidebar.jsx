// layout/Sidebar/Sidebar.jsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { getMenuItems } from './config/menuItems';
import useAuthStore    from '../../store/useAuthStore';
import useScopeStore   from '../../store/useScopeStore';
import { useMe }       from '../../hooks/useMe';

const roleColors = {
  superuser: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Super Admin' },
  admin:     { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Admin'       },
  user:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Utilisateur' },
};

const Sidebar = ({ role, scopedApiculteur }) => {
  const logout       = useAuthStore((s) => s.logout);
  const clearScope   = useScopeStore((s) => s.clearScope);
  const navigate     = useNavigate();
  const { data: me } = useMe();

  const menuItems = getMenuItems(role, scopedApiculteur);

  const handleLogout = () => {
    clearScope();
    logout();
    navigate('/login');
  };

  const profilePath = scopedApiculteur
    ? `/apiculteurs/${scopedApiculteur.id}/parametres/profile`
    : '/parametres/profile';

  const initials = me?.full_name
    ? me.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : me?.email?.[0]?.toUpperCase() ?? '?';

  const displayName = me?.full_name ?? me?.email ?? '—';
  const roleStyle   = roleColors[role] ?? roleColors.user;

  return (
    <aside className="w-[230px] min-h-screen bg-white border-r border-gray-100 flex flex-col">

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 13.3329V6.66626C17.4994 6.07143 17.1818 5.52201 16.6667 5.22459L10.8333 1.89126C10.3177 1.59354 9.68233 1.59354 9.16667 1.89126L3.33333 5.22459C2.81819 5.52201 2.50061 6.07143 2.5 6.66626V13.3329C2.50061 13.9278 2.81819 14.4772 3.33333 14.7746L9.16667 18.1079C9.68233 18.4056 10.3177 18.4056 10.8333 18.1079L16.6667 14.7746C17.1818 14.4772 17.4994 13.9278 17.5 13.3329" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">IBEE</span>
        </div>

        {scopedApiculteur?.company_name && (
          <div className="mt-3 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">Coopérative</p>
            <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">
              {scopedApiculteur.company_name}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (item.isBack) {
            return (
              <NavLink
                key     = {item.key}
                to      = {item.path}
                end     = {true}
                onClick = {clearScope}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                           text-amber-600 hover:bg-amber-50 transition-colors mb-2
                           border border-amber-200 bg-amber-50/50"
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key      = {item.key}
              to       = {item.path}
              end      = {item.end ?? true}
              className= {({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-colors ${
                   isActive
                     ? 'bg-gray-900 text-white'
                     : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                 }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom: user + logout ────────────────────────────── */}
      <div className="border-t border-gray-100">

        {/* User profile row */}
        <NavLink
          to        = {profilePath}
          end       = {true}
          className = {({ isActive }) =>
            `group flex items-center gap-3 px-4 py-3.5 transition-colors
             ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`
          }
        >
          {({ isActive }) => (
            <>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                  {displayName}
                </p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${roleStyle.bg} ${roleStyle.text}`}>
                  {roleStyle.label}
                </span>
              </div>

              {/* Arrow hint */}
              <ChevronRight
                size={14}
                className={`flex-shrink-0 transition-all duration-200
                  ${isActive ? 'text-gray-600' : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'}`}
              />
            </>
          )}
        </NavLink>

        {/* Logout */}
        <div className="px-3 pb-4 pt-1">
          <button
            onClick   = {handleLogout}
            className = "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;