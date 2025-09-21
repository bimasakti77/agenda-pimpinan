"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredToken, getStoredRefreshToken, clearAuthData, refreshAccessToken } from "@/lib/auth";
import toast from "react-hot-toast";

interface TokenManagerState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  tokenCountdown: {
    accessToken: number;
    refreshToken: number;
  };
}

export const useTokenManager = () => {
  const [state, setState] = useState<TokenManagerState>({
    isAuthenticated: false,
    isLoading: true,
    tokenCountdown: { accessToken: 0, refreshToken: 0 }
  });

  const [toastShown, setToastShown] = useState<{
    accessTokenWarning: boolean;
    refreshTokenWarning: boolean;
  }>({ accessTokenWarning: false, refreshTokenWarning: false });

  const calculateTokenCountdown = useCallback(() => {
    const accessToken = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    
    if (!accessToken || !refreshToken) {
      setState(prev => ({ ...prev, isAuthenticated: false, tokenCountdown: { accessToken: 0, refreshToken: 0 } }));
      return;
    }

    try {
      // Parse access token
      const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const accessExp = accessPayload.exp * 1000;
      const accessTimeLeft = Math.max(0, Math.floor((accessExp - Date.now()) / 1000));

      // Parse refresh token
      const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
      const refreshExp = refreshPayload.exp * 1000;
      const refreshTimeLeft = Math.max(0, Math.floor((refreshExp - Date.now()) / 1000));

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        tokenCountdown: {
          accessToken: accessTimeLeft,
          refreshToken: refreshTimeLeft
        }
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isAuthenticated: false, tokenCountdown: { accessToken: 0, refreshToken: 0 } }));
    }
  }, []);

  const checkTokenExpiry = useCallback(async () => {
    const accessToken = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    
    if (!accessToken || !refreshToken) {
      clearAuthData();
      window.location.href = "/login";
      return;
    }

    try {
      // Check access token expiry
      const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const accessExp = accessPayload.exp * 1000;
      const accessTimeLeft = Math.max(0, Math.floor((accessExp - Date.now()) / 1000));

      // Check refresh token expiry
      const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
      const refreshExp = refreshPayload.exp * 1000;
      const refreshTimeLeft = Math.max(0, Math.floor((refreshExp - Date.now()) / 1000));

      // Auto refresh when access token expires
      if (accessTimeLeft <= 0 && refreshTimeLeft > 0) {
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          // Reset toast flags for new tokens
          setToastShown({ accessTokenWarning: false, refreshTokenWarning: false });
          calculateTokenCountdown(); // Recalculate after refresh
        } else {
          clearAuthData();
          window.location.href = "/login";
        }
        return;
      }

      // Show warnings only once
      if (accessTimeLeft === 10 && !toastShown.accessTokenWarning) {
        toast("⚠️ Access token akan expired dalam 10 detik!", {
          duration: 3000,
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });
        setToastShown(prev => ({ ...prev, accessTokenWarning: true }));
      }
      
      if (refreshTimeLeft === 5 && !toastShown.refreshTokenWarning) {
        toast.error("🚨 Refresh token akan expired dalam 5 detik! Aplikasi akan redirect ke login.", {
          duration: 5000,
        });
        setToastShown(prev => ({ ...prev, refreshTokenWarning: true }));
      }

      // Redirect when refresh token expires
      if (refreshTimeLeft <= 0) {
        toast.error("⏰ Session expired! Redirecting to login...", {
          duration: 2000,
        });
        setTimeout(() => {
          clearAuthData();
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error) {
      clearAuthData();
      window.location.href = "/login";
    }
  }, [toastShown, calculateTokenCountdown]);

  // Initialize token checking
  useEffect(() => {
    calculateTokenCountdown();
    setState(prev => ({ ...prev, isLoading: false }));
  }, [calculateTokenCountdown]);

  // Token expiry checking
  useEffect(() => {
    const interval = setInterval(checkTokenExpiry, 5000);
    checkTokenExpiry(); // Initial check
    
    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  // Get user from localStorage
  const getUser = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      return null;
    }
  };

  return {
    ...state,
    user: getUser(),
    calculateTokenCountdown,
    checkTokenExpiry
  };
};
