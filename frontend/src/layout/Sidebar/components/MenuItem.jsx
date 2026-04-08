import React, { useMemo } from 'react';
import { NavLink } from 'react-router';
import * as Icons from 'lucide-react';

const MenuItem = ({ item }) => {
  const IconComponent = useMemo(
    () => Icons[item.icon] ?? (() => <span>•</span>),
    [item.icon]
  );

  return (
    <li role="menuitem">
      <NavLink
        to={item.href ?? '#'}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
           transition-colors duration-200 ease-in-out
           ${isActive
             ? 'bg-[#331F15] text-white'
             : 'text-base-content hover:bg-base-200'
           }`
        }
        aria-label={item.label}
      >
        {({ isActive }) => (
          <>
            <span className="flex-shrink-0 w-5 flex justify-center">
              <IconComponent
                className={`w-4 h-4 ${isActive ? 'text-white' : 'text-base-content/70'}`}
              />
            </span>

            <span className="flex-1">{item.label}</span>

            {item.count !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-base-300 text-base-content'
                  }`}
              >
                {item.count}
              </span>
            )}

            {item.badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-content">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
};

export default MenuItem;