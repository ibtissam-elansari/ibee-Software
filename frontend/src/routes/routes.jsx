import ProtectedRoute from './ProtectedRoute';
import { GestionPage, HomePage, SettingsPage } from '../pages';
import AuthPage from '../pages/Auth/AuthPage';
import HiveAnalyticsPage from '../pages/Analytics/HiveAnalyticsPage';
import MetricDetailPage from '../pages/Analytics/MetricDetailPage';
import AlertStatsPage from '../pages/AlertStats/AlertStatsPage'

export const publicRoutes = [
  { path: '/login', element: AuthPage },
];

export const protectedRoutes = [
  {
    element  : <ProtectedRoute allowedRoles={['user', 'admin', 'superuser']} />,
    children : [
      { path: '/',           element: HomePage },
      { path: '/parametres', element: SettingsPage },
      { path: '/gestion',   element: GestionPage},
      { path: '/gestion/:hiveId',                      element: HiveAnalyticsPage   },
      { path: '/gestion/:hiveId/details/:metric',      element: MetricDetailPage    },
      { path: '/statistique-alertes', element: AlertStatsPage },
    ],
  },
  // {
  //   element  : <ProtectedRoute allowedRoles={['admin', 'superuser']} />,
  //   children : [
  //     { path: '/utilisateurs', element: UsersPage },
  //   ],
  // },
  {
    element  : <ProtectedRoute allowedRoles={['superuser']} />,
    children : [

    ],
  },
];