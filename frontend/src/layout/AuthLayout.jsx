import { Outlet } from 'react-router';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <Outlet />
    </div>
  );
};

export default AuthLayout;