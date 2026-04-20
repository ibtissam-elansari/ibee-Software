import {
  LayoutDashboard,
  Settings,
  BarChart2,
  Users,
  Hexagon,
} from 'lucide-react';

export const superuserMenuItems = [
  {
    key  : 'apiculteurs',
    label: 'Gestion des Apiculteurs',
    icon : Users,
    path : '/apiculteurs',
  },
  {
    key  : 'parametres',
    label: 'Paramètres',
    icon : Settings,
    path : '/parametres',
  },
];

export const userMenuItems = [
  {
    key  : 'dashboard',
    label: 'Dashboard',
    icon : LayoutDashboard,
    path : '/dashboard',
  },
  {
    key  : 'gestion',
    label: 'Gestion',
    icon : Hexagon,
    path : '/gestion',
  },
  {
    key  : 'alertes',
    label: 'Statistique des alertes',
    icon : BarChart2,
    path : '/statistique-alertes',
  },
  {
    key  : 'parametres',
    label: 'Paramètres',
    icon : Settings,
    path : '/parametres',
  },
];

export const adminMenuItems = [...userMenuItems];

export const getMenuItems = (role) => {
  if (role === 'superuser') return superuserMenuItems;
  if (role === 'admin')     return adminMenuItems;
  return userMenuItems;
};