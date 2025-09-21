// Auth utility functions

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  email: string;
}

export const clearAuthData = () => {
  localStorage.removeItem("token");
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
  return localStorage.getItem("token");
};

export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};
