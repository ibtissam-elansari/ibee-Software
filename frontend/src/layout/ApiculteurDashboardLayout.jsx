import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, Outlet, useLocation } from 'react-router';
import { ChevronLeft, LayoutDashboard, BarChart2, Settings, Menu } from 'lucide-react';
import { useApiculteur } from '../hooks/useApiculteurs';
import useAuthStore from '../store/useAuthStore';

const ApiculteurDashboardLayout = () => {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { apiculteurId } = useParams();
  const role             = useAuthStore(s => s.user?.role ?? s.role);
  const isSuperuser      = role === 'superuser';

  const { data: apiculteur, isLoading } = useApiculteur(apiculteurId);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const base = `/apiculteurs/${apiculteurId}`;

  const navItems = [
    { path: `${base}/dashboard`,           label: 'Dashboard',            Icon: LayoutDashboard },
    {
      path:  `${base}/gestion`,
      label: 'Gestion des ruches',
      Icon:  ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/>
        </svg>
      ),
    },
    { path: `${base}/statistique-alertes`, label: 'Statistiques alertes', Icon: BarChart2 },
    ...(!isSuperuser ? [{ path: `${base}/parametres`, label: 'Paramètres', Icon: Settings }] : []),
  ];

  const SidebarContent = () => (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-white
                      lg:m-2 lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z" fill="white" opacity="0.9"/>
            <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-900">IBEE</span>
      </div>

      {/* Back button — superuser only */}
      {isSuperuser && (
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
      )}

      {/* Cooperative badge */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Coopérative</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">
          {isLoading ? '…' : (apiculteur?.company_name ?? '—')}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ path, label, Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={path.endsWith('dashboard')}
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

      {/* Logout — for user/admin */}
      {!isSuperuser && (
        <div className="px-3 pb-4">
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       font-medium text-red-400 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FDFAF4' }}>

      {/* ── Mobile backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar: desktop static / mobile drawer ──────────── */}
      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden
                      lg:m-2 lg:ml-0">

        {/* Mobile top-bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 lg:hidden">
          <button
            onClick   = {() => setSidebarOpen(true)}
            className = "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F5A623] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z" fill="white" opacity="0.9"/>
                <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">IBEE</span>
          </div>

          {/* Cooperative name on mobile */}
          {!isLoading && apiculteur?.company_name && (
            <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 truncate max-w-[140px]">
              {apiculteur.company_name}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto
                         lg:bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm">
          <Outlet context={{ apiculteurId, apiculteur }} />
        </main>
      </div>
    </div>
  );
};

export default ApiculteurDashboardLayout;