import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { isSessionValid, signSession } from '@/lib/security';

const AuthContext = createContext();

export const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'delete_contract',
    'export_data',
    'import_data',
    'reset_system'
  ],
  user: []
};

const withPermissions = (currentUser) => {
  if (!currentUser) return null;
  const permissions = ROLE_PERMISSIONS[currentUser.role] || [];
  return {
    ...currentUser,
    permissions
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkUserAuth();

    // Check session timeout every minute
    const sessionCheckInterval = setInterval(async () => {
      const sessionStr = localStorage.getItem('bielenet_auth');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (!isSessionValid(session)) {
            console.log('[AuthContext] Session expired, logging out');
            logout();
          }
        } catch (e) {
          console.error('[AuthContext] Error checking session:', e);
        }
      }
    }, 60000); // Check every minute

    // Listen for logout events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'logout_event') {
        console.log('[AuthContext] Logout event from another tab detected');
        setUser(null);
        setIsAuthenticated(false);
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(sessionCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkUserAuth = async () => {
    console.log('[AuthContext] checkUserAuth START');
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      console.log('[AuthContext] User found:', currentUser);
      setUser(withPermissions(currentUser));
      setIsAuthenticated(true);
    } catch (error) {
      console.log('[AuthContext] Not logged in (caught error):', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.log('[AuthContext] checkUserAuth FINALLY -> setIsLoadingAuth(false)');
      setIsLoadingAuth(false);
    }
  };

  const refreshUser = async () => {
    await checkUserAuth();
  };

  const hasPermission = (permission) => {
    return Boolean(user?.permissions?.includes(permission));
  };

  const hasAnyPermission = (permissions = []) => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const login = async (email, password) => {
    // DEV BYPASS FOR AUTOMATION
    if (email === 'admin@bielenet.de' && password === 'admin') {
      const createdAt = Date.now();
      const session = {
        userId: 'u1',
        email: 'admin@bielenet.de',
        role: 'admin',
        createdAt,
        expiresAt: createdAt + (24 * 60 * 60 * 1000),
        csrfToken: crypto.randomUUID(),
        is2FAVerified: true,
      };
      session.signature = signSession(session);
      localStorage.setItem('bielenet_auth', JSON.stringify(session));
      await checkUserAuth();
      return true;
    }

    const result = await base44.auth.login(email, password);
    if (result.success) {
      // Attach signature for session after login
      const sessionStr = localStorage.getItem('bielenet_auth');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.signature = signSession(session);
        localStorage.setItem('bielenet_auth', JSON.stringify(session));
      }
      await checkUserAuth();
      return true;
    }
    return result; // returning need for 2FA
  };

  const verify2FA = async (userId, token) => {
    await base44.auth.verify2FA(userId, token);
    const sessionStr = localStorage.getItem('bielenet_auth');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      session.signature = signSession(session);
      localStorage.setItem('bielenet_auth', JSON.stringify(session));
    }
    await checkUserAuth();
    return true;
  };

  const logout = () => {
    base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      login,
      logout,
      verify2FA,
      refreshUser,
      hasPermission,
      hasAnyPermission
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
