import { Outlet } from 'react-router';
import beeImage from '../assets/bee.png';

const AuthLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left: form side ── */}
      <div
        className="relative flex flex-col h-full w-full lg:w-[55%]"
        style={{ background: '#FAFAF7' }}
      >
        {/* Logo */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 flex items-center gap-2.5 z-10">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F5A623' }}
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L15.5 4.75V10.25L11 13L6.5 10.25V4.75L11 2Z" fill="white" opacity="0.9"/>
              <circle cx="11" cy="7.5" r="2.2" fill="#F5A623"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-wide">IBEE</span>
        </div>

        {/* Form — centered, full width on mobile, capped at 420 px on larger screens */}
        <div className="flex flex-col justify-center items-center h-full px-5 sm:px-8">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── Right: amber brand side ── */}
      <div
        className="hidden lg:flex lg:w-[45%] h-full relative overflow-hidden items-center justify-center"
        style={{ backgroundColor: '#F5A623' }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 640 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: 0.18 }}
        >
          <circle cx="580" cy="80"  r="380" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="580" cy="80"  r="280" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="580" cy="80"  r="180" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="80"  cy="820" r="300" stroke="white" strokeWidth="1.2" fill="none"/>
          <circle cx="80"  cy="820" r="200" stroke="white" strokeWidth="1.2" fill="none"/>
        </svg>
        <img
          src={beeImage}
          alt="IBEE bee"
          className="relative z-10 w-[70%] max-w-[420px] opacity-10"
          style={{ objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};

export default AuthLayout;