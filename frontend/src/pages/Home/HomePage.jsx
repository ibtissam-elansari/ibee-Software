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

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden p-3 sm:p-4 gap-4">

        <div className="flex-shrink-0">
          <StatusField apiculteurId={id} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <HivesField apiculteurId={id} />
        </div>

        <div className="xl:hidden flex-shrink-0 rounded-2xl border border-gray-100 overflow-hidden bg-white max-h-80">
          <Notifications apiculteurId={id} />
        </div>
      </div>

      <div className="hidden xl:flex w-80 flex-shrink-0 flex-col overflow-hidden my-3 mr-3 rounded-2xl border border-gray-100 bg-white">
        <Notifications apiculteurId={id} />
      </div>
    </div>
  );
};

export default HomePage;