import React from 'react';
import { useNavigate, useParams, Outlet } from 'react-router';
import { ChevronLeft, LayoutDashboard, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router';

const ApiculteurDashboardLayout = () => {
  const navigate   = useNavigate();
  const { userId } = useParams();

  return (
    <div className="min-h-screen bg-base-200">

      {/* ── Left sidebar ── */}
      <aside className="fixed left-2 top-2 bottom-2 w-64 bg-base-100 rounded-box
                        shadow-sm z-20 flex flex-col">

        {/* IBEE Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-base-200">
          <div className="w-9 h-9 rounded-lg bg-[#F5A623] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z" fill="white" opacity="0.9"/>
              <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-base-content">IBEE</span>
        </div>

        {/* Retour button — matches Figma exactly */}
        <div className="px-3 pt-4">
          <button
            onClick={() => navigate('/apiculteurs')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
                       border border-amber-200 text-amber-600 text-sm font-medium
                       hover:bg-amber-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            Retour au super compte
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <NavLink
                to={`/apiculteurs/${userId}/dashboard`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                   transition-colors
                   ${isActive ? 'bg-[#331F15] text-white' : 'text-base-content hover:bg-base-200'}`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`/apiculteurs/${userId}/hives`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                   transition-colors
                   ${isActive ? 'bg-[#331F15] text-white' : 'text-base-content hover:bg-base-200'}`
                }
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/>
                </svg>
                Gestion des ruches
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ── Main content — full width (no right panel) ── */}
      <main className="fixed top-2 bottom-2 left-[17rem] right-2 overflow-y-auto
                       bg-base-100 shadow-sm rounded-box">
        <Outlet />
      </main>
    </div>
  );
};

export default ApiculteurDashboardLayout;