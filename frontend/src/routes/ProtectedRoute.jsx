// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const user            = useAuthStore((s) => s.user);
  const { apiculteurId } = useParams();

  // Not authenticated → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Account created but not yet approved by superuser → holding page
  if (user.is_pending) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Scope guard: admin/user cannot access another coop's routes
  if (
    apiculteurId &&
    user.role !== 'superuser' &&
    user.apiculteur_id !== null &&
    Number(apiculteurId) !== user.apiculteur_id
  ) {
    return <Navigate to={`/apiculteurs/${user.apiculteur_id}/dashboard`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;