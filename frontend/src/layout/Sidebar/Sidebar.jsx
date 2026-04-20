import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { getMenuItems } from './config/menuItems';
import useAuthStore from '../../store/useAuthStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore(s => s.logout);
  // Read role from user object first, fall back to top-level role
  const role     = useAuthStore(s => s.user?.role ?? s.role ?? null);

  const items = getMenuItems(role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-2 top-2 bottom-2 w-64 rounded-2xl bg-white shadow-sm flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z"
                  fill="white" opacity="0.9"/>
            <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-900">IBEE</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {items.map(({ key, label, icon: Icon, path }) => (
            <li key={key}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                   transition-colors
                   ${isActive
                     ? 'bg-[#1C0A00] text-white'
                     : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-red-400 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;