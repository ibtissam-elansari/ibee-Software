import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getMenuItems } from './config/menuItems';
import useAuthStore    from '../../store/useAuthStore';
import useScopeStore   from '../../store/useScopeStore';

const Sidebar = ({ role, scopedApiculteur }) => {
  const logout     = useAuthStore((s) => s.logout);
  const clearScope = useScopeStore((s) => s.clearScope);
  const navigate   = useNavigate();

  const menuItems = getMenuItems(role, scopedApiculteur);

  const handleLogout = () => {
    clearScope();
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[230px] min-h-screen bg-white border-r border-gray-100 flex flex-col">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 13.3334V6.66675C17.4994 6.07192 17.1818 5.5225 16.6667 5.22508L10.8333 1.89175C10.3177 1.59403 9.68233 1.59403 9.16667 1.89175L3.33333 5.22508C2.81819 5.5225 2.50061 6.07192 2.5 6.66675V13.3334C2.50061 13.9282 2.81819 14.4777 3.33333 14.7751L9.16667 18.1084C9.68233 18.4061 10.3177 18.4061 10.8333 18.1084L16.6667 14.7751C17.1818 14.4777 17.4994 13.9282 17.5 13.3334" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">IBEE</span>
        </div>

        {/* Coop context banner — shown when scoped (superuser or admin/user) */}
        {scopedApiculteur?.company_name && (
          <div className="mt-3 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">
              Coopérative
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">
              {scopedApiculteur.company_name}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Back button — distinct style
          if (item.isBack) {
            return (
              <NavLink
                key    = {item.key}
                to     = {item.path}
                onClick= {clearScope}
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
              key       = {item.key}
              to        = {item.path}
              className = {({ isActive }) =>
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

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick   = {handleLogout}
          className = "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;