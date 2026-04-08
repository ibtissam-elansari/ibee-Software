import DashboardLayout from "../layout/DashboardLayout";
import { GestionPage, HomePage, SettingsPage } from "../pages";

const routes = [
  {
    path: '/',
    element: HomePage
  },
  {
    path: '/gestion',
    element: GestionPage
  },
  {
    path: '/parametres',
    element: SettingsPage
  }
]

export default routes;