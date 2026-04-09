import { GestionPage, HomePage, SettingsPage, AuthPage } from "../pages";

export const publicRoutes = [
  { path: '/login', element: AuthPage },
];

export const protectedRoutes = [
  { path: '/',  element: HomePage },
  { path: '/gestion', element: GestionPage },
  { path: '/parametres', element: SettingsPage}
];