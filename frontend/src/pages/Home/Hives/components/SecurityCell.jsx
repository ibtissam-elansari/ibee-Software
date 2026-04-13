import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

const SecurityCell = ({ doorOpen }) => {
  if (doorOpen == null) return <span className="text-base-300">—</span>;

  return doorOpen ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.7384 11.2153C3.7384 8.32475 6.08166 5.98151 8.9722 5.98151C11.8628 5.98151 14.206 8.32475 14.206 11.2153C14.206 14.1059 11.8628 16.4491 8.9722 16.4491C6.08166 16.4491 3.7384 14.1059 3.7384 11.2153Z" fill="#1D5FCA" stroke="#1D5FCA" stroke-width="1.0625"/>
      <path d="M5.60767 7.10306V4.86001C5.60767 3.0018 7.11404 1.49542 8.97225 1.49542C10.1388 1.49542 11.1667 2.08909 11.7702 2.99079" stroke="#1D5FCA" stroke-width="1.0625"/>
      <path d="M8.97217 12.0468V10.4677" stroke="white" stroke-width="1.12204" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

  ) : (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_34_965)">
      <path d="M4.29797 11.7294C4.29797 8.85646 6.62697 6.52747 9.49993 6.52747C12.3729 6.52747 14.7019 8.85646 14.7019 11.7294C14.7019 14.6024 12.3729 16.9314 9.49993 16.9314C6.62697 16.9314 4.29797 14.6024 4.29797 11.7294Z" fill="#1D5FCA" stroke="#1D5FCA" stroke-width="1.05604" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.844 7.64219V5.41278C12.844 3.56588 11.3468 2.06866 9.49988 2.06866C7.65297 2.06866 6.15576 3.56588 6.15576 5.41278V7.64219" stroke="#1D5FCA" stroke-width="1.05604" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.49988 12.4726V10.9863" stroke="#FBFAF7" stroke-width="1.05604" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_34_965">
        <rect width="19" height="19" fill="white"/>
      </clipPath>
    </defs>
    </svg>

  );
};

export default SecurityCell;