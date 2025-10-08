# Web Development Standards Documentation

## 1. Modern React Data Fetching Pattern

### Nama Metode
**"Separation of Initial Load and Manual Refresh Pattern"**

### Alternative Names
- **"Controlled Data Fetching Pattern"**
- **"useEffect + useCallback Anti-Pattern Prevention"**
- **"Manual Refresh After Mutation Pattern"**

### Core Pattern Implementation
```javascript
// ✅ STANDARD PATTERN
const Component = () => {
  // 1. State Management
  const [data, setData] = useState(null);
  
  // 2. Memoized async functions
  const loadData = useCallback(async () => {
    // API call logic
  }, []);
  
  // 3. Initial load (once only)
  useEffect(() => {
    if (condition) {
      loadData();
    }
  }, [condition]); // Only essential dependencies
  
  // 4. Manual refresh function
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);
  
  // 5. Event handlers with manual refresh
  const handleSave = async () => {
    await saveData();
    refreshData(); // Manual refresh after mutation
  };
};
```

### Key Principles
1. **Initial Load**: Automatic once when component mounts/user authenticates
2. **Manual Refresh**: Triggered after mutations (create, update, delete)
3. **Prevent Infinite Loops**: Use `useCallback` and minimal `useEffect` dependencies
4. **Separation of Concerns**: Separate data loading from data refreshing

### Industry Standards
- **React Query/TanStack Query Pattern**
- **SWR (Stale-While-Revalidate) Pattern**
- **Next.js App Router Pattern**
- **Vue 3 Composition API Pattern**
- **Angular Modern Pattern**

---

## 2. Modern Authentication & Token Management Pattern (Industry Standard)

### Nama Metode
**"React Query + JWT Token Management Pattern"**

### Alternative Names
- **"TanStack Query Authentication Pattern"**
- **"SWR Token Management Pattern"**
- **"Industry Standard Token Lifecycle Pattern"**
- **"OAuth 2.0 + JWT with React Query Pattern"**

### Industry Standard Implementation (React Context + Singleton Pattern)

#### **1. AuthContext Setup**
```javascript
// ✅ AUTH CONTEXT SETUP
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ APP WRAPPER
function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

#### **2. Unified Token Manager (Singleton Pattern)**
```javascript
// ✅ UNIFIED TOKEN MANAGER
export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<boolean> | null = null;
  private isRefreshing = false;

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public getTokenInfo(): TokenInfo {
    const accessToken = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    // ... token validation logic
  }

  public async refresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    // ... refresh logic with deduplication
  }
}

export const tokenManager = TokenManager.getInstance();
```

#### **3. AuthContext Implementation**
```javascript
// ✅ AUTH CONTEXT WITH CENTRALIZED STATE
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: { access: null, refresh: null },
  });

  const login = useCallback((tokens, user) => {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    setAuthState({ isAuthenticated: true, isLoading: false, user, tokens });
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    setAuthState({ isAuthenticated: false, isLoading: false, user: null, tokens: { access: null, refresh: null } });
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **4. Protected Route Component**
```javascript
// ✅ PROTECTED ROUTE WITH AUTH CONTEXT
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <AccessDenied />;
  }

  return children;
};
```

#### **5. API Service Integration**
```javascript
// ✅ API SERVICE WITH UNIFIED TOKEN MANAGER
class ApiService {
  private setupInterceptors(): void {
    // Request interceptor
    httpClient.addRequestInterceptor(async (config) => {
      const authHeader = tokenManager.getAuthHeader();
      if (!authHeader) {
        window.location.href = '/login';
        throw new Error('No authentication token');
      }
      return { ...config, headers: { ...config.headers, 'Authorization': authHeader } };
    });

    // Response interceptor
    httpClient.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        const refreshSuccess = await tokenManager.refresh();
        if (!refreshSuccess) {
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }
      return response;
    });
  }
}
```

#### **6. Usage in Components**
```javascript
// ✅ COMPONENT USING AUTH CONTEXT
const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout(); // Centralized logout
  };

  return (
    <ProtectedPage title="Dashboard">
      <div>Welcome {user?.full_name}</div>
      <button onClick={handleLogout}>Logout</button>
    </ProtectedPage>
  );
};
```

// ✅ PROTECTED PAGE COMPONENT
const ProtectedPage = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useTokenManager();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Role-based access control
  if (requiredRole && user?.role !== requiredRole) {
    return <AccessDenied requiredRole={requiredRole} />;
  }
  
  return <>{children}</>;
};

// ✅ API SERVICE WITH INTERCEPTORS
class ApiService {
  private setupInterceptors() {
    // Request interceptor for authentication
    httpClient.addRequestInterceptor(async (config) => {
      const token = getStoredToken();
      
      if (!token) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('No authentication token');
      }

      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        },
      };
    });

    // Response interceptor for token refresh
    httpClient.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        const refreshSuccess = await this.handleTokenRefresh();
        
        if (refreshSuccess) {
          // Retry original request with new token
          const newToken = getStoredToken();
          if (newToken) {
            // Retry logic
          }
        } else {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication failed');
        }
      }
      return response;
    });
  }
}
```

### Key Principles
1. **Token Storage**: Secure storage in localStorage/sessionStorage
2. **Auto-Refresh**: Automatic access token refresh before expiry
3. **Interceptors**: Request/Response interceptors for token management
4. **Protected Routes**: Automatic redirect to login on token expiry
5. **Role-Based Access**: Additional layer of authorization
6. **Secure Logout**: Complete token cleanup on logout

### Industry Standards
- **OAuth 2.0 + JWT Standard**
- **RFC 6749 (OAuth 2.0 Authorization Framework)**
- **RFC 7519 (JSON Web Token)**
- **OpenID Connect Standard**
- **JWT Best Practices (OWASP)**

### Security Features
- **Token Expiry Validation**
- **Automatic Token Refresh**
- **Secure Token Storage**
- **CSRF Protection**
- **XSS Prevention**
- **Role-Based Access Control (RBAC)**

---

## 3. Implementation Guidelines

### For Data Fetching Pattern
When implementing this pattern, ensure:
1. ✅ Import `useCallback` from React
2. ✅ Wrap all async functions with `useCallback`
3. ✅ Use `useEffect` only for initial data loading
4. ✅ Create separate manual refresh functions
5. ✅ Call refresh functions after mutations
6. ✅ Minimize `useEffect` dependencies to prevent infinite loops

### For Token Management Pattern
When implementing this pattern, ensure:
1. ✅ Implement token expiry checking
2. ✅ Set up automatic token refresh
3. ✅ Use request/response interceptors
4. ✅ Implement protected route components
5. ✅ Add role-based access control
6. ✅ Secure token storage and cleanup

### Quick Reference Tags
- `#ModernReactPattern`
- `#DataFetchingBestPractice`
- `#JWTTokenManagement`
- `#ProtectedRoutes`
- `#AutoRefreshToken`
- `#RBACImplementation`

### Framework Compatibility
- **React 16.8+** (Hooks)
- **Next.js 12+** (App Router)
- **Vue 3** (Composition API)
- **Angular 14+** (Standalone Components)
- **Svelte/SvelteKit**
- **SolidJS**

---

## 4. Industry Adoption

### Companies Using These Patterns
- **Netflix, Airbnb, Uber** (React)
- **GitHub, Shopify** (Next.js)
- **Laravel Nova, Inertia.js** (Vue)
- **Angular Material, Ionic** (Angular)
- **Discord, Twitch** (Various frameworks)

### Performance Benefits
- **Reduced API Calls**: Only when necessary
- **Better Caching**: Efficient data management
- **Improved UX**: Predictable loading states
- **Resource Efficiency**: Less server load
- **Security**: Proper token lifecycle management

---

## 5. Token Configuration Guide

### Environment Variables Configuration

The following environment variables can be used to configure token management behavior. These variables should be set in your `.env.local`, `.env.development`, or `.env.production` files.

#### **Frontend Environment Variables (.env.local)**
```bash
# Token Management Configuration
NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=30000        # How often to check token expiry (in milliseconds)
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300       # When to proactively refresh token (in seconds before expiry)
NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD=300       # When to show warning for refresh token (in seconds before expiry)
NEXT_PUBLIC_TOKEN_TOAST_DURATION=10000        # Duration for toast notifications (in milliseconds)
NEXT_PUBLIC_TOKEN_LOGOUT_DELAY=2000           # Delay before redirecting to login after session expiry (in milliseconds)

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Development Configuration
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### **Backend Environment Variables (.env)**
```bash
# JWT Configuration - Industry Standard
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m                            # Access token expiry (15 minutes - Google standard)
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-this-in-production
REFRESH_TOKEN_EXPIRES_IN=7d                   # Refresh token expiry (7 days - Google standard)

# Token Management Configuration
TOKEN_CHECK_INTERVAL=30000                    # How often to check token expiry (in milliseconds)
TOKEN_REFRESH_THRESHOLD=300                   # When to proactively refresh token (in seconds before expiry)
TOKEN_WARNING_THRESHOLD=300                   # When to show warning for refresh token (in seconds before expiry)

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Configuration in `authConfig.ts`

The `frontend/src/config/authConfig.ts` file reads these environment variables and provides default fallback values if they are not set.

```typescript
// frontend/src/config/authConfig.ts
/**
 * Authentication Configuration
 * Centralized configuration for token management
 *
 * Environment Variables:
 * - NEXT_PUBLIC_TOKEN_CHECK_INTERVAL: Token checking interval (ms)
 * - NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD: Token refresh threshold (seconds)
 * - NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD: Warning threshold (seconds)
 * - NEXT_PUBLIC_TOKEN_TOAST_DURATION: Toast duration (ms)
 * - NEXT_PUBLIC_TOKEN_LOGOUT_DELAY: Logout delay (ms)
 */

// Token checking intervals (in milliseconds) - Environment-based
export const TOKEN_CONFIG = {
  // How often to check token expiry
  CHECK_INTERVAL: parseInt(process.env.NEXT_PUBLIC_TOKEN_CHECK_INTERVAL || '30000'), // 30 seconds default

  // When to proactively refresh token (in seconds)
  REFRESH_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD || '300'), // 5 minutes default

  // When to show warning for refresh token (in seconds)
  WARNING_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD || '300'), // 5 minutes default

  // Toast notification duration (in milliseconds)
  TOAST_DURATION: parseInt(process.env.NEXT_PUBLIC_TOKEN_TOAST_DURATION || '10000'), // 10 seconds default

  // Logout delay after session expiry (in milliseconds)
  LOGOUT_DELAY: parseInt(process.env.NEXT_PUBLIC_TOKEN_LOGOUT_DELAY || '2000'), // 2 seconds default
} as const;

// Environment-based configuration
export const getTokenConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Example: Faster checking in development for quicker feedback
  if (isDevelopment) {
    return {
      ...TOKEN_CONFIG,
      CHECK_INTERVAL: parseInt(process.env.NEXT_PUBLIC_TOKEN_CHECK_INTERVAL_DEV || '10000'), // 10 seconds in dev
      REFRESH_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD_DEV || '120'), // 2 minutes in dev
    };
  }

  // Default to TOKEN_CONFIG for production or if no specific env override
  return TOKEN_CONFIG;
};
```

### Production vs Development Configuration

#### **Development Configuration (Testing)**
```bash
# Frontend .env.local - Development
NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=5000         # 5 seconds (faster for testing)
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=10        # 10 seconds
NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD=5         # 5 seconds

# Backend .env - Development
JWT_EXPIRES_IN=30s                            # 30 seconds (for testing)
REFRESH_TOKEN_EXPIRES_IN=1m                   # 1 minute (for testing)
```

#### **Production Configuration (Industry Standard)**
```bash
# Frontend .env.local - Production
NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=30000        # 30 seconds
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300       # 5 minutes
NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD=300       # 5 minutes

# Backend .env - Production
JWT_EXPIRES_IN=15m                            # 15 minutes (Google standard)
REFRESH_TOKEN_EXPIRES_IN=7d                   # 7 days (Google standard)
```

### App Type Based Configuration

```typescript
// Example of app type based configuration (optional)
export const APP_CONFIG = {
  HIGH_SECURITY: {
    CHECK_INTERVAL: 15000,    // 15 seconds
    REFRESH_THRESHOLD: 120,   // 2 minutes
    WARNING_THRESHOLD: 180,   // 3 minutes
    TOAST_DURATION: 15000,
    LOGOUT_DELAY: 1000,
  },
  GENERAL: { // Default
    CHECK_INTERVAL: 30000,    // 30 seconds
    REFRESH_THRESHOLD: 300,   // 5 minutes
    WARNING_THRESHOLD: 300,   // 5 minutes
    TOAST_DURATION: 10000,
    LOGOUT_DELAY: 2000,
  },
  ENTERPRISE: {
    CHECK_INTERVAL: 60000,    // 1 minute
    REFRESH_THRESHOLD: 600,   // 10 minutes
    WARNING_THRESHOLD: 600,   // 10 minutes
    TOAST_DURATION: 8000,
    LOGOUT_DELAY: 3000,
  },
  MOBILE: {
    CHECK_INTERVAL: 45000,    // 45 seconds
    REFRESH_THRESHOLD: 300,   // 5 minutes
    WARNING_THRESHOLD: 300,   // 5 minutes
    TOAST_DURATION: 12000,
    LOGOUT_DELAY: 2500,
  },
} as const;

export const getAppConfig = (appType: keyof typeof APP_CONFIG = 'GENERAL') => {
  return APP_CONFIG[appType];
};
```

### Security Considerations

#### **Frontend (.env.local)**
```bash
# ✅ SAFE - Public variables (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=30000
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300

# ❌ NEVER - Secret keys in frontend
# JWT_SECRET=secret-key  # DON'T DO THIS!
```

#### **Backend (.env)**
```bash
# ✅ SAFE - Server-side only
JWT_SECRET=your-secret-key
DB_PASSWORD=your-db-password

# ✅ SAFE - Token expiry configuration
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Configuration Matrix

| Setting | Frontend | Backend | Purpose |
|---------|----------|---------|---------|
| **Token Check Interval** | ✅ | ❌ | Client-side checking frequency |
| **Refresh Threshold** | ✅ | ❌ | When to refresh token |
| **Warning Threshold** | ✅ | ❌ | When to show warning |
| **Toast Duration** | ✅ | ❌ | UI feedback duration |
| **Logout Delay** | ✅ | ❌ | UX delay before logout |
| **JWT Secret** | ❌ | ✅ | Token signing key |
| **Access Token Expiry** | ❌ | ✅ | Token lifetime |
| **Refresh Token Expiry** | ❌ | ✅ | Refresh token lifetime |

### Testing Token Expired

For testing token expiry behavior:

1. **Set short token lifetime** in backend `.env`:
   ```bash
   JWT_EXPIRES_IN=30s        # 30 seconds
   REFRESH_TOKEN_EXPIRES_IN=1m  # 1 minute
   ```

2. **Set fast checking interval** in frontend `.env.local`:
   ```bash
   NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=5000    # 5 seconds
   NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=10   # 10 seconds
   NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD=5    # 5 seconds
   ```

3. **Restart both servers** and login to test

4. **Expected behavior**:
   - Warning appears 5 seconds before expiry
   - Auto-refresh happens 10 seconds before expiry
   - Logout occurs when refresh token expires

---

*This documentation follows industry standards and best practices for modern web application development.*
