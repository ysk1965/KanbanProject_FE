import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../utils/services';

interface User {
  id: string;
  email: string;
  name: string;
  profile_image?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 인증 상태 확인
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(authService.getCurrentUser());
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setIsAuthenticated(true);
    setCurrentUser(response.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await authService.signup(email, password, name);
    setIsAuthenticated(true);
    setCurrentUser(response.user);
  };

  const googleLogin = async (idToken: string) => {
    const response = await authService.googleLogin(idToken);
    setIsAuthenticated(true);
    setCurrentUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        isLoading,
        login,
        signup,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
