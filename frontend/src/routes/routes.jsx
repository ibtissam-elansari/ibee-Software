import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout from '../layout/DashboardLayout';
import AuthLayout      from '../layout/AuthLayout';
import ProtectedRoute  from './ProtectedRoute';
import useAuthStore    from '../store/useAuthStore';

// Pages
import AuthPage          from '../pages/Auth/AuthPage';
import HomePage          from '../pages/Home/HomePage';
import GestionPage       from '../pages/Gestion/GestionPage';
import HiveAnalyticsPage from '../pages/Analytics/HiveAnalyticsPage';
import MetricDetailPage  from '../pages/Analytics/MetricDetailPage';
import AlertStatsPage    from '../pages/AlertStats/AlertStatsPage';
import SettingsPage      from '../pages/Settings/SettingsPage';
import ApiculteursPage   from '../pages/Apiculteurs/ApiculteursPage';

// ── Root redirect ─────────────────────────────────────────────────────────────
// Sends each role to the correct landing page after login.
const RootRedirect = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'superuser') {
    // Superuser lands on the apiculteurs management page
    return <Navigate to="/apiculteurs" replace />;
  }

  if (user.apiculteur_id) {
    // Admin/User land directly on their coop's dashboard
    return <Navigate to={`/apiculteurs/${user.apiculteur_id}/dashboard`} replace />;
  }

  // Edge case: authenticated but no coop assigned
  return <Navigate to="/no-coop" replace />;
};

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── Auth (unauthenticated shell) ──────────────────────────────────────────
  {
    element : <AuthLayout />,
    children: [
      { path: '/login', element: <AuthPage /> },
    ],
  },

  // ── Superuser global routes ───────────────────────────────────────────────
  // Apiculteurs list + platform settings — no apiculteur scope
  {
    element : <ProtectedRoute allowedRoles={['superuser']} />,
    children: [
      {
        element : <DashboardLayout />,
        children: [
          { path: '/apiculteurs', element: <ApiculteursPage /> },
          { path: '/parametres',  element: <SettingsPage /> },
          { path: '/support',     element: <div>Support (todo)</div> },
        ],
      },
    ],
  },

  // ── Scoped cooperative dashboard ──────────────────────────────────────────
  // Shared by both superusers (drilling into a coop) and admin/users
  // (their own coop). ProtectedRoute.scopeGuard ensures admin/users can
  // only access their own apiculteur_id.
  {
    element : <ProtectedRoute allowedRoles={['superuser', 'admin', 'user']} />,
    children: [
      {
        path   : '/apiculteurs/:apiculteurId',
        element: <DashboardLayout />,   // same layout — sidebar adapts
        children: [
          // Default redirect: /apiculteurs/:id → /apiculteurs/:id/dashboard
          { index: true, element: <Navigate to="dashboard" replace /> },

          { path: 'dashboard',                       element: <HomePage /> },
          { path: 'gestion',                         element: <GestionPage /> },
          { path: 'gestion/:hiveId',                 element: <HiveAnalyticsPage /> },
          { path: 'gestion/:hiveId/details/:metric', element: <MetricDetailPage /> },
          { path: 'statistique-alertes',             element: <AlertStatsPage /> },
          { path: 'gestion/:hiveId',                    element: <HiveAnalyticsPage /> },
          { path: 'parametres',                      element: <SettingsPage /> },
          { path: 'parametres/compte',               element: <SettingsPage tab="compte" /> },
          { path: 'parametres/profile',              element: <SettingsPage tab="profile" /> },
        ],
      },
    ],
  },

  // ── Edge case: user with no coop assigned ─────────────────────────────────
  {
    path   : '/no-coop',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4]">
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

  // ── Root + 404 ────────────────────────────────────────────────────────────
  { path: '/',  element: <RootRedirect /> },
  { path: '*',  element: <RootRedirect /> },
]);