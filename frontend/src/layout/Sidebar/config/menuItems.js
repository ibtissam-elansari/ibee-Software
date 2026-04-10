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
    roles : ['superuser'],         
  },

  {
    label : 'Paramètres',
    icon  : 'Settings',
    href  : '/parametres',
    roles : ['user', 'admin', 'superuser'],
  },
];

export default menuItems;