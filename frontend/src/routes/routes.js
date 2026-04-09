// /routes/routes.js
import { GestionPage, HomePage, SettingsPage } from '../pages';
import AuthPage from '../pages/Auth/AuthPage';

export const publicRoutes = [
  { path: '/login', element: AuthPage },
];

export const protectedRoutes = [
  { path: '/',           element: HomePage },
  { path: '/gestion',    element: GestionPage },
  { path: '/parametres', element: SettingsPage },
];