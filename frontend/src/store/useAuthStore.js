// useAuthStore.js
import { create } from 'zustand';

const decodeToken = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])) }
  catch { return null }
};

const storedToken = localStorage.getItem('access_token');
const decoded     = storedToken ? decodeToken(storedToken) : null;

const useAuthStore = create((set) => ({
  token   : storedToken || null,
  role    : decoded?.role || null,
  email   : decoded?.sub  || null,
  userId  : null,

  setAuth : ({ access_token, role, email, user_id }) => {
    localStorage.setItem('access_token', access_token);
    set({ token: access_token, role, email, userId: user_id });
  },

  logout  : () => {
    localStorage.removeItem('access_token');
    set({ token: null, role: null, email: null, userId: null });
  },
}));

export default useAuthStore;