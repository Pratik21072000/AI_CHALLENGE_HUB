import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'Employee' | 'Management';

export interface User {
  username: string;
  role: UserRole;
  displayName: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasAccess: (requiredRole?: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user credentials
const MOCK_USERS: Record<string, { password: string; role: UserRole; displayName: string; department: string }> = {
  'employee01': {
    password: 'pass123',
    role: 'Employee',
    displayName: 'John Doe',
    department: 'Engineering'
  },
  'employee02': {
    password: 'pass234',
    role: 'Employee',
    displayName: 'Lisa Thompson',
    department: 'Design'
  },
  'employee03': {
    password: 'pass345',
    role: 'Employee',
    displayName: 'Mike Chen',
    department: 'Product'
  },
  'manager01': {
    password: 'admin456',
    role: 'Management',
    displayName: 'Sarah Wilson',
    department: 'Management'
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('challengeHub_user');
    console.log('🔍 AuthContext: Checking stored user:', storedUser ? 'Found' : 'Not found');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('✅ AuthContext: User restored:', userData.username, userData.role);
      } catch (error) {
        console.error('❌ AuthContext: Failed to parse stored user:', error);
        localStorage.removeItem('challengeHub_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = MOCK_USERS[username];
    
    if (mockUser && mockUser.password === password) {
      const userData: User = {
        username,
        role: mockUser.role,
        displayName: mockUser.displayName,
        department: mockUser.department
      };
      
      setUser(userData);
      localStorage.setItem('challengeHub_user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('challengeHub_user');
  };

  const hasAccess = (requiredRole?: UserRole): boolean => {
    if (!user) return false;
    if (!requiredRole) return true;
    
    // Management has access to everything, Employee has limited access
    if (user.role === 'Management') return true;
    return user.role === requiredRole;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
