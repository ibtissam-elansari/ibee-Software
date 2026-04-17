const menuItems = [
  {
    label : 'Dashboard',
    icon  : 'LayoutDashboard',
    href  : '/',
    roles : ['user', 'admin', 'superuser'],
  },
  { type: 'divider' },
  {
    label : 'Gestion',
    icon  : 'FolderCog',
    href  : '/gestion',
    roles : ['user', 'admin', 'superuser'],
  },
  // {
  //   label : 'Utilisateurs',
  //   icon  : 'Users',
  //   href  : '/utilisateurs',
  //   roles : ['admin', 'superuser'],    // both can manage users
  // },
  {
    label : 'Paramètres',
    icon  : 'Settings',
    href  : '/parametres',
    roles : ['user', 'admin', 'superuser'],
  },
];

export default menuItems;