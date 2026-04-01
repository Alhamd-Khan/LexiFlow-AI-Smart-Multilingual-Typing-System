import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = localStorage.getItem('lexiflow_user');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    login: (userData) => {
      localStorage.setItem('lexiflow_user', JSON.stringify(userData));
      set({ user: userData, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('lexiflow_user');
      set({ user: null, isAuthenticated: false });
    },
  };
});
