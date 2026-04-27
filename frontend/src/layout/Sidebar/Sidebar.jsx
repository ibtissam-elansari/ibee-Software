// layout/Sidebar/Sidebar.jsx

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
            <span className="text-white text-sm font-bold">🐝</span>
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Back button — distinct style, always uses end:true
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
              end      = {item.end ?? true}   // default to exact match
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