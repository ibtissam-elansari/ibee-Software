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
} from 'lucide-react';

/**
 * @param {'superuser'|'admin'|'user'} role
 * @param {{ id: number, company_name: string } | null} scopedApiculteur
 * @returns {Array}
 */
export function getMenuItems(role, scopedApiculteur) {
  const isScoped = !!scopedApiculteur;

  // ── Case 1: Superuser global view (no coop selected) ──────────────────────
  if (role === 'superuser' && !isScoped) {
    return [
      { key: 'apiculteurs', label: 'Gestion des Apiculteurs', path: '/apiculteurs',      icon: Building2     },
      { key: 'roles',       label: 'Gestion des rôles',       path: '/parametres/roles', icon: Users         },
      { key: 'support',     label: 'Demande support',         path: '/support',           icon: MessageSquare },
      { key: 'parametres',  label: 'Paramètres',              path: '/parametres',        icon: Settings      },
    ];
  }

  // ── Case 2 & 3: Scoped coop dashboard (superuser scoped OR admin/user) ────
  const base = `/apiculteurs/${scopedApiculteur.id}`;

  const items = [];

  // Back button — superuser only
  if (role === 'superuser' && isScoped) {
    items.push({
      key   : 'back',
      label : 'Retour au super compte',
      path  : '/apiculteurs',
      icon  : ChevronLeft,
      isBack: true,
    });
  }

  items.push(
    { key: 'dashboard', label: 'Dashboard',          path: `${base}/dashboard`,           icon: LayoutDashboard },
    { key: 'gestion',   label: 'Gestion des ruches', path: `${base}/gestion`,             icon: Wrench          },
    // NOTE: "Statistiques" is NOT a sidebar item.
    // It is accessed by clicking a hive card inside GestionPage → HiveAnalyticsPage.
    { key: 'alerts',    label: 'Alertes',             path: `${base}/statistique-alertes`, icon: BellRing        },
  );

  // Account management — admin/user only
  if (role !== 'superuser') {
    items.push(
      { key: 'compte',  label: 'Gestion des compte', path: `${base}/parametres/compte`,  icon: Settings   },
      { key: 'profile', label: 'Profile',             path: `${base}/parametres/profile`, icon: UserCircle },
    );
  }

  return items;
}