import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import DashboardLayout           from '../layout/DashboardLayout';
import AuthLayout                from '../layout/AuthLayout';
import ApiculteurDashboardLayout from '../layout/ApiculteurDashboardLayout';
import ProtectedRoute            from './ProtectedRoute';
import useAuthStore              from '../store/useAuthStore';

// Pages
import AuthPage          from '../pages/Auth/AuthPage';
import HomePage          from '../pages/Home/HomePage';
import GestionPage       from '../pages/Gestion/GestionPage';
import HiveAnalyticsPage from '../pages/Analytics/HiveAnalyticsPage';
import MetricDetailPage  from '../pages/Analytics/MetricDetailPage';
import AlertStatsPage    from '../pages/AlertStats/AlertStatsPage';
import SettingsPage      from '../pages/Settings/SettingsPage';
import ApiculteursPage   from '../pages/Apiculteurs/ApiculteursPage';

// Apiculteur-scoped sub-pages
import HivesField  from '../pages/Home/Hives/HivesField';
import StatusField from '../pages/Home/Cards/StatusField';

const ApiculteurHomePage = () => (
  <div className="flex flex-col gap-4 p-6">
    <StatusField />
    <HivesField />
  </div>
);

// Redirects superuser → /apiculteurs, everyone else → /dashboard
const RootRedirect = () => {
  const role = useAuthStore(s => s.user?.role ?? s.role ?? null);
  if (role === 'superuser') return <Navigate to="/apiculteurs" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([

  // ── Auth (no sidebar) ─────────────────────────────────────────────────────
  {
    element : <AuthLayout />,
    children: [
      { path: '/login', element: <AuthPage /> },
    ],
  },

  // ── User & Admin (with main sidebar) ──────────────────────────────────────
  {
    element : <ProtectedRoute allowedRoles={['user', 'admin']} />,
    children: [
      {
        element : <DashboardLayout />,
        children: [
          { path: '/dashboard',                          element: <HomePage /> },
          { path: '/gestion',                            element: <GestionPage /> },
          { path: '/gestion/:hiveId',                    element: <HiveAnalyticsPage /> },
          { path: '/gestion/:hiveId/details/:metric',    element: <MetricDetailPage /> },
          { path: '/statistique-alertes',                element: <AlertStatsPage /> },
          { path: '/parametres',                         element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── Superuser (with main sidebar) ─────────────────────────────────────────
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

  // ── Scoped apiculteur view (superuser viewing a client) ───────────────────
  {
    element : <ProtectedRoute allowedRoles={['superuser']} />,
    children: [
      {
        element : <ApiculteurDashboardLayout />,
        children: [
          { path: '/apiculteurs/:userId/dashboard', element: <ApiculteurHomePage /> },
          { path: '/apiculteurs/:userId/hives',     element: <GestionPage /> },
        ],
      },
    ],
  },

  // ── Root + fallback — redirect based on role ──────────────────────────────
  { path: '/',  element: <RootRedirect /> },
  { path: '*',  element: <RootRedirect /> },
]);