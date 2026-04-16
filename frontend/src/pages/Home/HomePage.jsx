import React from 'react';
import StatusField    from './Cards/StatusField';
import HivesField     from './Hives/HivesField';
import Notifications  from './Notifications/Notifications';

const HomePage = () => {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#FBFAF7' }}>

      {/* ── Left: scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-2">
          <StatusField />
          <HivesField />
        </div>
      </div>

      <div className="w-80 flex-shrink-0 border-l border-base-200 overflow-hidden rounded-2xl my-2">
        <Notifications />
      </div>
    </div>
  );
};

export default HomePage;