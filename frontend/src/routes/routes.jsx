import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import DashboardLayout           from '../layout/DashboardLayout';
import AuthLayout                from '../layout/AuthLayout';
import ApiculteurDashboardLayout from '../layout/ApiculteurDashboardLayout';
import ProtectedRoute            from './ProtectedRoute';
import useAuthStore              from '../store/useAuthStore';

// Pages
import AuthPage          from '../pages/Auth/AuthPage';
import GestionPage       from '../pages/Gestion/GestionPage';
import HiveAnalyticsPage from '../pages/Analytics/HiveAnalyticsPage';
import MetricDetailPage  from '../pages/Analytics/MetricDetailPage';
import AlertStatsPage    from '../pages/AlertStats/AlertStatsPage';
import SettingsPage      from '../pages/Settings/SettingsPage';
import ApiculteursPage   from '../pages/Apiculteurs/ApiculteursPage';

// Scoped cooperative pages
import ApiculteurHomePage    from '../pages/Apiculteurs/scoped/ApiculteurHomePage';
import ApiculteurGestionPage from '../pages/Apiculteurs/scoped/ApiculteurGestionPage';

/**
 * Smart root redirect:
 * - superuser              → /apiculteurs          (manage all coops)
 * - user/admin with coop   → /apiculteurs/:id/dashboard  (their coop's dashboard)
 * - user/admin without coop → /dashboard           (fallback, shouldn't happen)
 */
const RootRedirect = () => {
  const user = useAuthStore(s => s.user);
  const role = user?.role ?? useAuthStore.getState().role;

  if (role === 'superuser') {
    return <Navigate to="/apiculteurs" replace />;
  }
  if (user?.apiculteur_id) {
    return <Navigate to={`/apiculteurs/${user.apiculteur_id}/dashboard`} replace />;
  }
  // Fallback — user exists but has no coop assigned yet
  return <Navigate to="/no-coop" replace />;
};

export const router = createBrowserRouter([

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    element : <AuthLayout />,
    children: [
      { path: '/login', element: <AuthPage /> },
    ],
  },

  // ── Superuser — manages all cooperatives ──────────────────────────────────
  {
    element : <ProtectedRoute allowedRoles={['superuser']} />,
    children: [
      {
        element : <DashboardLayout />,
        children: [
          { path: '/apiculteurs', element: <ApiculteursPage /> },
          { path: '/parametres',  element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── User & Admin — scoped to their cooperative ────────────────────────────
  // They land on /apiculteurs/:apiculteurId/* just like superuser's scoped view,
  // but ProtectedRoute ensures only their own coop ID works.
  {
    element : <ProtectedRoute allowedRoles={['user', 'admin']} />,
    children: [
      {
        path   : '/apiculteurs/:apiculteurId',
        element: <ApiculteurDashboardLayout />,
        children: [
          { path: 'dashboard',                       element: <ApiculteurHomePage /> },
          { path: 'gestion',                         element: <ApiculteurGestionPage /> },
          { path: 'gestion/:hiveId',                 element: <HiveAnalyticsPage /> },
          { path: 'gestion/:hiveId/details/:metric', element: <MetricDetailPage /> },
          { path: 'statistique-alertes',             element: <AlertStatsPage /> },
          { path: 'parametres',                      element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── Superuser scoped view (drills into a coop's dashboard) ────────────────
  {
    element : <ProtectedRoute allowedRoles={['superuser']} />,
    children: [
      {
        path   : '/apiculteurs/:apiculteurId',
        element: <ApiculteurDashboardLayout />,
        children: [
          { path: 'dashboard',                       element: <ApiculteurHomePage /> },
          { path: 'gestion',                         element: <ApiculteurGestionPage /> },
          { path: 'gestion/:hiveId',                 element: <HiveAnalyticsPage /> },
          { path: 'gestion/:hiveId/details/:metric', element: <MetricDetailPage /> },
          { path: 'statistique-alertes',             element: <AlertStatsPage /> },
        ],
      },
    ],
  },

  // ── No coop assigned (edge case) ──────────────────────────────────────────
  {
    path   : '/no-coop',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm">
          <p className="text-lg font-bold text-gray-900 mb-2">Compte non configuré</p>
          <p className="text-sm text-gray-400">
            Votre compte n'est pas encore associé à une coopérative.
            Contactez votre administrateur.
          </p>
        </div>
      </div>
    ),
  },

  // ── Root + fallback ───────────────────────────────────────────────────────
  { path: '/',  element: <RootRedirect /> },
  { path: '*',  element: <RootRedirect /> },
]);