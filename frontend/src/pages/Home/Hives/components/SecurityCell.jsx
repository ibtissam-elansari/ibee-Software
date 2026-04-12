import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

const SecurityCell = ({ doorOpen }) => {
  if (doorOpen == null) return <span className="text-base-300">—</span>;

  return doorOpen ? (
    <LockOpen className="w-5 h-5 text-red-500" />
  ) : (
    <Lock className="w-5 h-5 text-blue-500" />
  );
};

export default SecurityCell;