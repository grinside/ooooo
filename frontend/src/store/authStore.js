import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      userType: null, // 'affiliate' | 'admin' | null
      isAuthenticated: false,

      // Actions
      setAuth: (user, token, userType) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userType', userType);

        set({
          user,
          token,
          userType,
          isAuthenticated: true,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');

        set({
          user: null,
          token: null,
          userType: null,
          isAuthenticated: false,
        });
      },

      // Initialize from localStorage
      initAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const userType = localStorage.getItem('userType');

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              userType,
              isAuthenticated: true,
            });
          } catch (error) {
            // Invalid stored data, clear it
            get().logout();
          }
        }
      },

      // Check if user has permission
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;

        // Admin has all permissions
        if (get().userType === 'admin') return true;

        // Check specific permission
        return user.permissions?.includes(permission) || false;
      },

      // Check if user is admin
      isAdmin: () => {
        return get().userType === 'admin';
      },

      // Check if user is affiliate
      isAffiliate: () => {
        return get().userType === 'affiliate';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
