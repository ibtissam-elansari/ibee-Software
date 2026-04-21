import { create } from 'zustand';

const decodeToken = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
};

const storedToken = localStorage.getItem('access_token');
const decoded     = storedToken ? decodeToken(storedToken) : null;

// Reconstruct a user object from whatever is stored/decoded
const initialUser = decoded
  ? { role: decoded.role ?? null, email: decoded.sub ?? null, id: decoded.user_id ?? null }
  : null;

const useAuthStore = create((set) => ({
  token  : storedToken || null,
  role   : decoded?.role    || null,   // keep for legacy selectors
  email  : decoded?.sub     || null,   // keep for legacy selectors
  userId : decoded?.user_id || null,
  user   : initialUser,                // ← single source of truth for components

  setAuth: ({ access_token, role, email, user_id }) => {
    localStorage.setItem('access_token', access_token);
    const user = { id: user_id, role, email };
    set({ token: access_token, role, email, userId: user_id, user });
  },

  // Called after a profile update to keep the store in sync
  setUser: (updatedUser) => {
    set(s => ({
      user  : { ...s.user, ...updatedUser },
      email : updatedUser.email ?? s.email,
      role  : updatedUser.role  ?? s.role,
    }));
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, role: null, email: null, userId: null, user: null });
  },
}));

export default useAuthStore;