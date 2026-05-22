// src/store/useAuthStore.js
import { create }      from 'zustand';
import { queryClient } from '../queryClient';

const decodeToken = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
};

const storedToken = localStorage.getItem('access_token');
const decoded     = storedToken ? decodeToken(storedToken) : null;

const initialUser = decoded ? {
  id           : decoded.user_id       ?? null,
  role         : decoded.role          ?? null,
  email        : decoded.sub           ?? null,
  apiculteur_id: decoded.apiculteur_id ?? null,
  is_pending   : decoded.is_pending    ?? false,   // ← persist across refresh
} : null;

const useAuthStore = create((set) => ({
  token        : storedToken            || null,
  role         : decoded?.role          || null,
  email        : decoded?.sub           || null,
  userId       : decoded?.user_id       || null,
  apiculteurId : decoded?.apiculteur_id || null,
  user         : initialUser,

  setAuth: ({ access_token, role, email, user_id, apiculteur_id, is_pending = false }) => {
    localStorage.setItem('access_token', access_token);
    const user = {
      id           : user_id,
      role,
      email,
      apiculteur_id: apiculteur_id ?? null,
      is_pending   : is_pending,               // ← stored so ProtectedRoute can read it
    };
    set({
      token        : access_token,
      role,
      email,
      userId       : user_id,
      apiculteurId : apiculteur_id ?? null,
      user,
    });
  },

  setUser: (updatedUser) => {
    set(s => ({
      user         : { ...s.user, ...updatedUser },
      email        : updatedUser.email         ?? s.email,
      role         : updatedUser.role          ?? s.role,
      apiculteurId : updatedUser.apiculteur_id ?? s.apiculteurId,
    }));
  },

  logout: () => {
    localStorage.removeItem('access_token');
    queryClient.clear();
    import('./useScopeStore').then(m => m.default.getState().clearScope());
    set({ token: null, role: null, email: null, userId: null, apiculteurId: null, user: null });
  },
}));

export default useAuthStore;