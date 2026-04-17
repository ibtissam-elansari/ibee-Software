import React from 'react';
import { useSettingsPage } from './hooks/useSettingsPage';
import ProfilePanel          from './components/ProfilePanel';
import AccountManagementPanel from './components/AccountManagementPanel';

const SettingsPage = () => {
  const settings = useSettingsPage();
  const { actorRole } = settings;

  const canManageUsers = actorRole === 'admin' || actorRole === 'superuser';

  return (
    <div className="flex gap-6 p-6 min-h-full" style={{ background: '#FDFAF4' }}>

      {/* ── Left: Profile ── */}
      <div className={canManageUsers ? 'w-96 flex-shrink-0' : 'w-full max-w-md mx-auto'}>
        <ProfilePanel {...settings} />
      </div>

      {/* ── Right: Account management (admin/superuser only) ── */}
      {canManageUsers && (
        <div className="flex-1 min-w-0">
          <AccountManagementPanel />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;