import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar               from './Sidebar/Sidebar';
import useAuthStore          from '../store/useAuthStore';
import useScopeStore         from '../store/useScopeStore';
import { useApiculteurList } from '../hooks/useApiculteurs';
import { Menu, X }           from 'lucide-react';

const DashboardLayout = () => {
  const user                                                   = useAuthStore((s) => s.user);
  const { scopedApiculteur, setScopedApiculteur, clearScope }  = useScopeStore();
  const { apiculteurId }                                       = useParams();
  const { data: apiculteurs }                                  = useApiculteurList();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync scope for superuser on direct URL navigation / refresh
  useEffect(() => {
    if (user?.role !== 'superuser') return;
    if (apiculteurId) {
      const found = apiculteurs?.find((a) => a.id === Number(apiculteurId));
      setScopedApiculteur({
        id:           Number(apiculteurId),
        company_name: found?.company_name ?? '...',
      });
    } else {
      clearScope();
    }
  }, [apiculteurId, apiculteurs, user?.role]);

  // Close drawer when route changes (nav click on mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [apiculteurId]);

  const resolvedScope =
    user?.role !== 'superuser' && user?.apiculteur_id
      ? { id: user.apiculteur_id, company_name: '' }
      : scopedApiculteur;

  return (
    <div className="flex h-screen bg-[#FDFAF4] overflow-hidden">

      {/* ── Mobile backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      {/*
          Desktop: always visible, static in the flex row.
          Mobile:  slide-in drawer fixed on the left, behind z-30.
      */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 h-full
          transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          role             = {user?.role}
          scopedApiculteur = {resolvedScope}
          onNavigate       = {() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top-bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 lg:hidden">
          <button
            onClick   = {() => setSidebarOpen(true)}
            className = "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          {/* Mini logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M17.5 13.3329V6.66626C17.4994 6.07143 17.1818 5.52201 16.6667 5.22459L10.8333 1.89126C10.3177 1.59354 9.68233 1.59354 9.16667 1.89126L3.33333 5.22459C2.81819 5.52201 2.50061 6.07143 2.5 6.66626V13.3329C2.50061 13.9278 2.81819 14.4772 3.33333 14.7746L9.16667 18.1079C9.68233 18.4056 10.3177 18.4056 10.8333 18.1079L16.6667 14.7746C17.1818 14.4772 17.4994 13.9278 17.5 13.3329"
                  stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900">IBEE</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;