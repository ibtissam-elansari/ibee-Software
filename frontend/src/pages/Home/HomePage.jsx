import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import StatusField   from './Cards/StatusField';
import HivesField    from './Hives/HivesField';
import Notifications from './Notifications/Notifications';

const HomePage = () => {
  const { apiculteurId } = useParams();
  const id = Number(apiculteurId);

  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden relative" style={{ background: '#FBFAF7' }}>

      {/* ── Left/Main: scrollable content ── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="flex flex-col gap-4 p-3 sm:p-4 pb-20 xl:pb-4">
          <StatusField    apiculteurId={id} />
          <HivesField     apiculteurId={id} />

          {/* Notifications inline — only on small screens, below content */}
          <div className="xl:hidden rounded-2xl border border-gray-100 overflow-hidden bg-white">
            <Notifications apiculteurId={id} />
          </div>
        </div>
      </div>

      {/* ── Right sidebar: notifications — desktop only ── */}
      <div className="hidden xl:flex w-80 flex-shrink-0 border-l border-gray-100 overflow-hidden my-2 mr-2 rounded-2xl bg-white">
        <Notifications apiculteurId={id} />
      </div>
    </div>
  );
};

export default HomePage;