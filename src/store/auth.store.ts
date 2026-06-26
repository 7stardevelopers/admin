import { create } from 'zustand';
import Cookies from 'js-cookie';

interface AuthUser {
  name: string;
  phone: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    Cookies.remove('admin_token');
    set({ user: null });
  },
}));
