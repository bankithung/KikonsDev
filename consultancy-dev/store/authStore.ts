import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: string | string[]) => boolean;
  isDevAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('token/', { username, password });
          const { access, refresh } = response.data;
          localStorage.setItem('auth-token', access);
          localStorage.setItem('refresh-token', refresh);

          // Set cookie for middleware
          document.cookie = `auth-token=${access}; path=/; max-age=86400; SameSite=Lax`;

          // Fetch user details
          const userResponse = await api.get('users/me/');
          set({
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail ||
            error.response?.data?.message ||
            'Login failed. Please check your credentials.';
          console.error('Login failed:', error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      signup: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // If company admin signup, create a signup request
          if (userData.role === 'COMPANY_ADMIN') {
            await api.post('signup-requests/', {
              username: userData.username,
              email: userData.email,
              password: userData.password,
              first_name: userData.first_name,
              last_name: userData.last_name,
              company_name: userData.company_name,
              admin_name: userData.admin_name,
              phone: userData.phone,
              plan: userData.plan || 'Starter'
            });
            set({ isLoading: false, error: null });
          } else {
            // Regular employee signup (requires company admin)
            await api.post('users/', userData);
            set({ isLoading: false, error: null });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail ||
            error.response?.data?.message ||
            'Signup failed. Please try again.';
          console.error('Signup failed:', error);
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        set({ user: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          // Ensure cookie is set if token exists (e.g. after refresh)
          if (!document.cookie.includes('auth-token=')) {
            document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
          }

          set({ isLoading: true });
          try {
            const userResponse = await api.get('users/me/');
            set({
              user: userResponse.data,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (error) {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('refresh-token');
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        }
      },

      clearError: () => {
        set({ error: null });
      },

      hasRole: (role: string | string[]) => {
        const user = get().user;
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      isDevAdmin: () => {
        const user = get().user;
        return user?.role === 'DEV_ADMIN';
      },

      isCompanyAdmin: () => {
        const user = get().user;
        return user?.role === 'COMPANY_ADMIN';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
