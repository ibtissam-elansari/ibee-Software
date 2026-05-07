import React from 'react';
import { useParams } from 'react-router-dom';
import StatusField   from './Cards/StatusField';
import HivesField    from './Hives/HivesField';
import Notifications from './Notifications/Notifications';

const HomePage = () => {
  const { apiculteurId } = useParams();
  const id = Number(apiculteurId);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#FBFAF7' }}>

      {/* ── Main scrollable column ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="flex flex-col gap-4 p-3 sm:p-4">
          <StatusField apiculteurId={id} />
          <HivesField  apiculteurId={id} />

          {/* Notifications — inline on smaller screens, hidden on xl+ */}
          <div className="xl:hidden rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <Notifications apiculteurId={id} />
          </div>
        </div>
      </div>

      {/* ── Notifications sidebar — xl+ only, independently scrollable ── */}
      <div className="hidden xl:flex w-80 flex-shrink-0 flex-col overflow-hidden my-3 mr-3 rounded-2xl border border-gray-100 bg-white">
        <Notifications apiculteurId={id} />
      </div>
    </div>
  );
};

export default HomePage;