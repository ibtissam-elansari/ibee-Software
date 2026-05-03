// layout/Sidebar/config/menuItems.js

import {
  LayoutDashboard,
  Building2,
  Settings,
  Users,
  BellRing,
  Wrench,
  UserCircle,
  ChevronLeft,
  MessageSquare,
  HeadphonesIcon
} from 'lucide-react';

export function getMenuItems(role, scopedApiculteur) {
  const isScoped = !!scopedApiculteur;

  // ── Superuser global view ──────────────────────────────────────────────────
  if (role === 'superuser' && !isScoped) {
    return [
      { key: 'apiculteurs', label: 'Apiculteurs',       path: '/apiculteurs',      icon: Building2,    end: true  },
      { key: 'roles',       label: 'Gestion des rôles', path: '/parametres/roles', icon: Users,        end: true  },
      // end: true → only active when path is EXACTLY /parametres/profile, not /parametres/roles
      { key: 'support',  label : 'Support',       path  : '/support',          icon  : HeadphonesIcon,  end: true },
      { key: 'profile',  label: 'Profile',        path: '/parametres/profile', icon: Settings,          end: true  },
    ];
  }

  // ── Scoped coop dashboard (superuser scoped OR admin/user) ─────────────────
  const base = `/apiculteurs/${scopedApiculteur.id}`;
  const items = [];

  if (role === 'superuser' && isScoped) {
    items.push({
      key   : 'back',
      label : 'Retour au super compte',
      path  : '/apiculteurs',
      icon  : ChevronLeft,
      isBack: true,
      end   : true,
    });
  }

  items.push(
    { key: 'dashboard', label: 'Dashboard',          path: `${base}/dashboard`,           icon: LayoutDashboard,  end: true },
    { key: 'gestion',   label: 'Gestion des ruches', path: `${base}/gestion`,             icon: Wrench,           end: false },
    { key: 'alerts',    label: 'Alertes',            path: `${base}/statistique-alertes`, icon: BellRing,         end: true  },
  );

  if (role === 'admin') {
    items.push(
      // end: true → /parametres/compte does NOT activate this item
      { key: 'compte',  label: 'Gestion des compte', path: `${base}/parametres/compte`,  icon: Settings,   end: true },
      { key: 'support',   label : 'Support',           path: `${base}/support`,             icon: HeadphonesIcon,   end: true },
      // end: true → /parametres/profile does NOT activate 'compte' item
      { key: 'profile', label: 'Profile',             path: `${base}/parametres/profile`, icon: UserCircle, end: true },
    );
  }

  if (role === 'user') {
    items.push(
      { key: 'support',   label : 'Support',           path: `${base}/support`,             icon: HeadphonesIcon,   end: true },
      // end: true → /parametres/profile does NOT activate 'compte' item
      { key: 'profile', label: 'Profile',             path: `${base}/parametres/profile`, icon: UserCircle, end: true },
    );
  }

  return items;
}