// routes.jsx
import ProtectedRoute from './ProtectedRoute';
import { GestionPage, HomePage, SettingsPage } from '../pages';
import AuthPage from '../pages/Auth/AuthPage';

export const publicRoutes = [
  { path: '/login', element: AuthPage },
];

export const protectedRoutes = [
  {
    element: <ProtectedRoute allowedRoles={['user', 'admin', 'superuser']} />,
    children: [
      { path: '/', element: HomePage },
      { path: '/parametres', element: SettingsPage },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin', 'superuser']} />,
    children: [
      { path: '/gestion', element: GestionPage },
    ],
  },
];