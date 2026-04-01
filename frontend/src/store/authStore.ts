import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = localStorage.getItem('lexiflow_user');
  const storedToken = localStorage.getItem('lexiflow_token');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: initialUser,
    token: storedToken,
    isAuthenticated: !!initialUser,
    login: (userData, token) => {
      localStorage.setItem('lexiflow_user', JSON.stringify(userData));
      localStorage.setItem('lexiflow_token', token);
      set({ user: userData, token: token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('lexiflow_user');
      localStorage.removeItem('lexiflow_token');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
