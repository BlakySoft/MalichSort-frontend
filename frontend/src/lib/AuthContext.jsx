import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return user;

  return {
    ...user,
    profile_completed: user.profile_completed === true || user.profile_completed === 1 || user.profile_completed === '1',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    if (!base44.auth.isAuthenticated()) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(normalizeUser(currentUser));
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    // apiClient.logout ya fuerza una recarga completa a la ruta indicada,
    // así que no hace falta (ni conviene) navegar de nuevo después.
    base44.auth.logout(shouldRedirect ? '/login' : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Se conserva por compatibilidad con componentes que lo usaban;
      // ya no dependemos de "public settings" de Base44.
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
