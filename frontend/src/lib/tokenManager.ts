/**
 * Unified Token Manager - Industry Standard
 * Single source of truth for all token operations
 */

import { getStoredToken, getStoredRefreshToken, clearAuthData, refreshAccessToken } from './auth';

export interface TokenInfo {
  access: string | null;
  refresh: string | null;
  isExpired: boolean;
  timeLeft: number;
}

export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get current token information
   */
  public getTokenInfo(): TokenInfo {
    const accessToken = getStoredToken();
    const refreshToken = getStoredRefreshToken();

    if (!accessToken || !refreshToken) {
      return {
        access: null,
        refresh: null,
        isExpired: true,
        timeLeft: 0,
      };
    }

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeLeft = Math.max(0, payload.exp - currentTime);

      return {
        access: accessToken,
        refresh: refreshToken,
        isExpired: payload.exp < currentTime,
        timeLeft: Math.floor(timeLeft),
      };
    } catch (error) {
      return {
        access: accessToken,
        refresh: refreshToken,
        isExpired: true,
        timeLeft: 0,
      };
    }
  }

  /**
   * Check if token is valid and not expired
   */
  public isValid(): boolean {
    const tokenInfo = this.getTokenInfo();
    return !tokenInfo.isExpired && tokenInfo.access !== null;
  }

  /**
   * Get authorization header
   */
  public getAuthHeader(): string | null {
    const tokenInfo = this.getTokenInfo();
    return tokenInfo.access ? `Bearer ${tokenInfo.access}` : null;
  }

  /**
   * Refresh token with deduplication
   */
  public async refresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performRefresh(): Promise<boolean> {
    try {
      return await refreshAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Clear all tokens and auth data
   */
  public clear(): void {
    clearAuthData();
  }

  /**
   * Check if refresh token is about to expire
   */
  public isRefreshTokenExpiring(): boolean {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return true;

    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeLeft = payload.exp - currentTime;
      
      // Consider expiring if less than 5 minutes left
      return timeLeft < 300;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get time left for refresh token
   */
  public getRefreshTokenTimeLeft(): number {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return 0;

    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return Math.max(0, Math.floor(payload.exp - currentTime));
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
