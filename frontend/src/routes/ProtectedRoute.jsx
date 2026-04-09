// /routes/ProtectedRoutes.jsx
import { Navigate, Outlet } from 'react-router';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = () => {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;