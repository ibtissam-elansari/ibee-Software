// src/routes/routes.jsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import DashboardLayout       from '../layout/DashboardLayout';
import AuthLayout            from '../layout/AuthLayout';
import ProtectedRoute        from './ProtectedRoute';
import useAuthStore          from '../store/useAuthStore';

import AuthPage              from '../pages/Auth/AuthPage';
import PendingApprovalPage   from '../pages/Auth/PendingApprovalPage';
import HomePage              from '../pages/Home/HomePage';
import GestionPage           from '../pages/Gestion/GestionPage';
import GestionMapPage        from '../pages/Gestion/GestionMapPage';
import GestionParametresPage from '../pages/Gestion/GestionParametresPage';
import HiveAnalyticsPage     from '../pages/Analytics/HiveAnalyticsPage';
import MetricDetailPage      from '../pages/Analytics/MetricDetailPage';
import AlertStatsPage        from '../pages/AlertStats/AlertStatsPage';
import ApiculteursPage       from '../pages/Apiculteurs/ApiculteursPage';
import ProfilePage           from '../pages/Settings/ProfilePage';
import AccountManagementPage from '../pages/Settings/AccountManagementPage';
import RoleManagementPage    from '../pages/RoleManagement/RoleManagementPage';
import SupportPage           from '../pages/Support/SupportPage';
import SupportDashboardPage  from '../pages/Support/SupportDashboardPage';

const RootRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user)               return <Navigate to="/login"             replace />;
  if (user.is_pending)     return <Navigate to="/pending-approval"  replace />;
  if (user.role === 'superuser')
                           return <Navigate to="/apiculteurs"       replace />;
  if (user.apiculteur_id)  return <Navigate to={`/apiculteurs/${user.apiculteur_id}/dashboard`} replace />;
  return <Navigate to="/no-coop" replace />;
};

export const router = createBrowserRouter([

  // ── Public ──────────────────────────────────────────────────────────────
  {
    element : <AuthLayout />,
    children: [{ path: '/login', element: <AuthPage /> }],
  },

  // Stand-alone page — token exists but account is pending, no layout needed
  { path: '/pending-approval', element: <PendingApprovalPage /> },

  // ── Superuser global ─────────────────────────────────────────────────────
  {
    element : <ProtectedRoute allowedRoles={['superuser']} />,
    children: [{
      element : <DashboardLayout />,
      children: [
        { path: '/apiculteurs',        element: <ApiculteursPage /> },
        { path: '/parametres/roles',   element: <RoleManagementPage /> },
        { path: '/parametres/profile', element: <ProfilePage /> },
        { path: '/parametres',         element: <Navigate to="/parametres/profile" replace /> },
        { path: '/support',            element: <SupportDashboardPage /> },
      ],
    }],
  },

  // ── Scoped (superuser scoped + admin + user) ─────────────────────────────
  {
    element : <ProtectedRoute allowedRoles={['superuser', 'admin', 'user']} />,
    children: [{
      path   : '/apiculteurs/:apiculteurId',
      element: <DashboardLayout />,
      children: [
        { index: true,                             element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard',                       element: <HomePage /> },
        { path: 'gestion',                         element: <GestionPage /> },
        { path: 'gestion/map',                     element: <GestionMapPage /> },
        { path: 'thresholds',                      element: <GestionParametresPage /> },
        { path: 'gestion/:hiveId',                 element: <HiveAnalyticsPage /> },
        { path: 'gestion/:hiveId/details/:metric', element: <MetricDetailPage /> },
        { path: 'statistique-alertes',             element: <AlertStatsPage /> },
        { path: 'parametres/profile',              element: <ProfilePage /> },
        { path: 'parametres/compte',               element: <AccountManagementPage /> },
        { path: 'parametres',                      element: <Navigate to="parametres/profile" replace /> },
        { path: 'support',                         element: <SupportPage /> },
      ],
    }],
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  {
    path   : '/no-coop',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f7f4]">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm">
          <p className="text-lg font-bold text-gray-900 mb-2">Compte non configuré</p>
          <p className="text-sm text-gray-400">
            Votre compte n'est pas encore associé à une coopérative.
          </p>
        </div>
      </div>
    ),
  },
  { path: '/',  element: <RootRedirect /> },
  { path: '*',  element: <RootRedirect /> },
]);