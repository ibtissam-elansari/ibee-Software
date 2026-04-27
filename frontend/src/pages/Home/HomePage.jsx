import React from 'react';
import { useParams } from 'react-router-dom';
import StatusField   from './Cards/StatusField';
import HivesField    from './Hives/HivesField';
import Notifications from './Notifications/Notifications';

const HomePage = () => {
  // apiculteurId is in the URL for both superuser-scoped and admin/user views.
  // Pass it down so child components can scope their API calls correctly.
  const { apiculteurId } = useParams();
  const id = Number(apiculteurId);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#FBFAF7' }}>

      {/* ── Left: scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-2">
          <StatusField    apiculteurId={id} />
          <HivesField     apiculteurId={id} />
        </div>
      </div>

      <div className="w-80 flex-shrink-0 border-l border-base-200 overflow-hidden rounded-2xl my-2">
        <Notifications apiculteurId={id} />
      </div>
    </div>
  );
};

export default HomePage;