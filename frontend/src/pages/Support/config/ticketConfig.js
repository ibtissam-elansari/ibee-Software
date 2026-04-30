// src/pages/Support/config/ticketConfig.js

export const TICKET_TYPES = [
  { value: 'bug',          label: 'Bug',           icon: '🐛', desc: 'Comportement inattendu ou erreur' },
  { value: 'assistance',   label: 'Assistance',    icon: '🙋', desc: 'Aide à l\'utilisation' },
  { value: 'amelioration', label: 'Amélioration',  icon: '💡', desc: 'Suggestion de fonctionnalité' },
  { value: 'urgence',      label: 'Urgence',       icon: '🚨', desc: 'Problème critique, impact immédiat' },
];

export const TICKET_PRIORITIES = [
  { value: 'basse',   label: 'Basse',   color: 'text-gray-500   bg-gray-50   border-gray-200'   },
  { value: 'normale', label: 'Normale', color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  { value: 'haute',   label: 'Haute',   color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  { value: 'urgente', label: 'Urgente', color: 'text-red-600    bg-red-50    border-red-200'    },
];

export const TICKET_STATUSES = [
  { value: 'ouvert',   label: 'Ouvert',    color: 'text-blue-600  bg-blue-50  border-blue-200'  },
  { value: 'en_cours', label: 'En cours',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'resolu',   label: 'Résolu',    color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'ferme',    label: 'Fermé',     color: 'text-gray-500  bg-gray-50  border-gray-200'  },
];

export const getStatusStyle  = (v) => TICKET_STATUSES.find(s => s.value === v)   ?? TICKET_STATUSES[0];
export const getPriorityStyle = (v) => TICKET_PRIORITIES.find(p => p.value === v) ?? TICKET_PRIORITIES[1];
export const getTypeInfo      = (v) => TICKET_TYPES.find(t => t.value === v)      ?? TICKET_TYPES[1];

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};