import React from 'react';
import { Shield, ShieldCheck, User } from 'lucide-react';

const ROLE_CONFIG = {
  superuser: {
    bg   : 'bg-amber-50 border-amber-200',
    text : 'text-amber-700',
    Icon : ShieldCheck,
    label: 'Super Admin',
  },
  admin: {
    bg   : 'bg-blue-50 border-blue-200',
    text : 'text-blue-700',
    Icon : Shield,
    label: 'Admin',
  },
  user: {
    bg   : 'bg-gray-50 border-gray-200',
    text : 'text-gray-600',
    Icon : User,
    label: 'Utilisateur',
  },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
  const { Icon } = cfg;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
                      border text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

export default RoleBadge;