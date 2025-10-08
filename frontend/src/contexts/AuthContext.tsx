"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getStoredToken, getStoredRefreshToken, getStoredUser, clearAuthData, refreshAccessToken, type User } from '@/lib/auth';
import { getTokenConfig } from '@/config/authConfig';
import toast from 'react-hot-toast';

// Get token configuration
const TOKEN_CONFIG = getTokenConfig();

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: {
    access: string | null;
    refresh: string | null;
  };
}

interface AuthContextType extends AuthState {
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  checkTokenExpiry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: {
      access: null,
      refresh: null,
    },
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  // Initialize auth state from localStorage
  const initializeAuth = useCallback(() => {
    try {
      const accessToken = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      const user = getStoredUser();

      if (accessToken && refreshToken && user) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          tokens: {
            access: accessToken,
            refresh: refreshToken,
          },
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          tokens: {
            access: null,
            refresh: null,
          },
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: {
          access: null,
          refresh: null,
        },
      });
    }
  }, []);

  // Login function
  const login = useCallback((tokens: { accessToken: string; refreshToken: string }, user: User) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
      tokens: {
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      },
    });
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearAuthData();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: {
        access: null,
        refresh: null,
      },
    });

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [authState.user]);

  // Refresh tokens function
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const success = await refreshAccessToken();
      if (success) {
        const newAccessToken = getStoredToken();
        const newRefreshToken = getStoredRefreshToken();
        
        if (newAccessToken && newRefreshToken) {
          setAuthState(prev => ({
            ...prev,
            tokens: {
              access: newAccessToken,
              refresh: newRefreshToken,
            },
          }));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return false;
    }
  }, []);

  // Check token expiry
  const checkTokenExpiry = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const { access, refresh } = authState.tokens;
      
      if (!access || !refresh) {
        logout();
        return;
      }

      // Parse JWT tokens
      const accessPayload = JSON.parse(atob(access.split('.')[1]));
      const refreshPayload = JSON.parse(atob(refresh.split('.')[1]));
      
      const accessExp = accessPayload.exp * 1000;
      const refreshExp = refreshPayload.exp * 1000;
      
      const accessTimeLeft = Math.max(0, Math.floor((accessExp - Date.now()) / 1000));
      const refreshTimeLeft = Math.max(0, Math.floor((refreshExp - Date.now()) / 1000));

      // Proactive refresh when access token is about to expire (Industry standard)
      if (accessTimeLeft <= TOKEN_CONFIG.REFRESH_THRESHOLD && refreshTimeLeft > 0) {
        const refreshSuccess = await refreshTokens();
        if (!refreshSuccess) {
          logout();
        }
        return;
      }

      // Show warning when refresh token is about to expire
      if (refreshTimeLeft <= TOKEN_CONFIG.WARNING_THRESHOLD && refreshTimeLeft > 0) {
        toast.error(`🚨 Session akan berakhir dalam ${Math.floor(refreshTimeLeft / 60)} menit!`, {
          duration: TOKEN_CONFIG.TOAST_DURATION,
        });
      }

      // Redirect when refresh token expires
      if (refreshTimeLeft <= 0) {
        toast.error("⏰ Session expired! Redirecting to login...", {
          duration: 2000,
        });
        setTimeout(() => {
          logout();
        }, TOKEN_CONFIG.LOGOUT_DELAY);
      }
    } catch (error) {
      console.error('Error checking token expiry:', error);
      logout();
    } finally {
      isCheckingRef.current = false;
    }
  }, [authState.tokens, refreshTokens, logout]);

  // Setup token checking interval
  useEffect(() => {
    if (authState.isAuthenticated) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up new interval - Industry standard: 30 seconds
      intervalRef.current = setInterval(() => {
        checkTokenExpiry();
      }, TOKEN_CONFIG.CHECK_INTERVAL);

      // Initial check
      checkTokenExpiry();

      // Cleanup
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [authState.isAuthenticated, checkTokenExpiry]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshTokens,
    checkTokenExpiry,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
