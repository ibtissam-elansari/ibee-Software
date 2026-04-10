// useAuthStore.js
import { create } from 'zustand';

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};

const storedToken = localStorage.getItem('access_token');
const decoded = storedToken ? decodeToken(storedToken) : null;

const useAuthStore = create((set) => ({
  token: storedToken || null,
  user : decoded?.sub || null,
  role : decoded?.role || null,

  setToken: (token) => {
    localStorage.setItem('access_token', token);

    const decoded = decodeToken(token);

    set({
      token,
      user: decoded?.sub,
      role: decoded?.role,
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ token: null, user: null, role: null });
  },
}));

export default useAuthStore;