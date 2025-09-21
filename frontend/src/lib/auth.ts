// Auth utility functions

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  email: string;
}

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    
    const parsedUser = JSON.parse(userData);
    
    // Validate user object structure
    if (!parsedUser || typeof parsedUser !== 'object') {
      clearAuthData();
      return null;
    }
    
    // Check required fields
    if (!parsedUser.id || !parsedUser.username || !parsedUser.role) {
      clearAuthData();
      return null;
    }
    
    return parsedUser;
  } catch (error) {
    console.error("Failed to parse stored user data:", error);
    clearAuthData();
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If can't parse, consider expired
  }
};

export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      return true;
    } else {
      clearAuthData();
      return false;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    clearAuthData();
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  
  if (!token || !user) return false;
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    clearAuthData();
    return false;
  }
  
  return true;
};
