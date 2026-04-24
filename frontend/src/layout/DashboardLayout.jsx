import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar           from './Sidebar/Sidebar';
import useAuthStore      from '../store/useAuthStore';
import useScopeStore     from '../store/useScopeStore';
import { useApiculteurList } from '../hooks/useApiculteurs'; // to resolve name from ID

const DashboardLayout = () => {
  const user                                        = useAuthStore((s) => s.user);
  const { scopedApiculteur, setScopedApiculteur, clearScope } = useScopeStore();
  const { apiculteurId }                            = useParams();

  // When a superuser navigates to /apiculteurs/:id/*, sync the scope store.
  // This handles direct URL navigation / page refresh.
  const { data: apiculteurs } = useApiculteurList();

  useEffect(() => {
    if (user?.role !== 'superuser') return;

    if (apiculteurId) {
      // Resolve the company name from the cached list (or use a placeholder)
      const found = apiculteurs?.find((a) => a.id === Number(apiculteurId));
      setScopedApiculteur({
        id          : Number(apiculteurId),
        company_name: found?.company_name ?? '...',
      });
    } else {
      // Superuser is on a global route — clear any lingering scope
      clearScope();
    }
  }, [apiculteurId, apiculteurs, user?.role]);

  return (
    <div className="flex h-screen bg-[#f9f7f4] overflow-hidden">
      {/* Sidebar — knows role and scope, builds its own menu */}
      <Sidebar
        role             = {user?.role}
        scopedApiculteur = {
          // For admin/user, their "scope" is always their own coop
          user?.role !== 'superuser' && user?.apiculteur_id
            ? { id: user.apiculteur_id, company_name: '' }
            : scopedApiculteur
        }
      />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;