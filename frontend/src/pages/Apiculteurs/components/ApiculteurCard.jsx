import React from 'react';
import { Pencil, Home, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';

/**
 * ApiculteurCard — matches Figma Image 1 card exactly.
 *
 * Layout:
 *  Row 1 : avatar + name + date + pencil icon
 *  Row 2 : Active pill + Inactive pill
 *  Row 3 : ruches count + email
 *  Row 4 : phone + location
 *  Row 5 : "Détails" centered link
 */
const ApiculteurCard = ({ apiculteur, onEdit }) => {
  const navigate = useNavigate();

  const {
    user_id, company_name, email, phone,
    region, city, created_at,
    active_hives = 0, inactive_hives = 0, total_hives = 0,
  } = apiculteur;

  const dateStr = created_at
    ? new Date(created_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '—';

  const location = [city, region].filter(Boolean).join(', ') || '—';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm
                    hover:shadow-md transition-shadow">

      {/* Row 1: avatar + name/date + edit */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200
                        flex items-center justify-center flex-shrink-0 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{company_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => onEdit(apiculteur)}
          className="text-gray-400 hover:text-amber-500 transition-colors flex-shrink-0"
          title="Modifier"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: active/inactive pills */}
      <div className="flex gap-2">
        <span className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold
                         bg-green-100 text-green-700">
          {active_hives} Active
        </span>
        <span className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold
                         bg-red-50 text-red-400">
          {inactive_hives} Inactive
        </span>
      </div>

      {/* Row 3: ruches + email */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{total_hives} ruches</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{phone ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Détails link */}
      <button
        onClick={() => navigate(`/apiculteurs/${user_id}/dashboard`)}
        className="text-sm text-gray-500 hover:text-amber-500 transition-colors
                   text-center font-medium"
      >
        Détails
      </button>
    </div>
  );
};

export default ApiculteurCard;