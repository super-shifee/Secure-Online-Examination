'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  department?: string;
  enrollmentNumber?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Mock users for demo
      const mockUsers: Record<string, any> = {
        'student@example.com': {
          password: 'Password123!',
          user: { id: '1', email: 'student@example.com', name: 'John Student', role: 'STUDENT', enrollmentNumber: 'STU001', department: 'CS' }
        },
        'teacher@example.com': {
          password: 'Password123!',
          user: { id: '2', email: 'teacher@example.com', name: 'Jane Teacher', role: 'TEACHER' }
        },
        'admin@example.com': {
          password: 'Password123!',
          user: { id: '3', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' }
        }
      };

      // Check stored users from registration
      const storedUsers = localStorage.getItem('registered_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        Object.assign(mockUsers, parsed);
      }

      if (mockUsers[email] && mockUsers[email].password === password) {
        const user = mockUsers[email].user;
        const token = 'mock-token-' + Date.now();
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
        return;
      }

      throw new Error('Invalid email or password');
    } catch (error) {
      console.error('[v0] Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string, role: string) => {
    try {
      // Validate input
      if (!email || !name || !password) {
        throw new Error('Please fill in all required fields');
      }

      // Check if email already exists
      const mockUsers: Record<string, any> = {
        'student@example.com': true,
        'teacher@example.com': true,
        'admin@example.com': true
      };

      const storedUsers = localStorage.getItem('registered_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        Object.assign(mockUsers, parsed);
      }

      if (mockUsers[email]) {
        throw new Error('Email already registered');
      }

      // Create new user
      const userId = Math.random().toString(36).substr(2, 9);
      const newUser: User = {
        id: userId,
        email,
        name,
        role: (role as any) || 'STUDENT',
        enrollmentNumber: `STU${Date.now().toString().slice(-6)}`,
        department: 'General'
      };

      // Store the new user
      const storedUsersData = storedUsers ? JSON.parse(storedUsers) : {};
      storedUsersData[email] = {
        password,
        user: newUser
      };
      localStorage.setItem('registered_users', JSON.stringify(storedUsersData));

      // Log them in
      const token = 'mock-token-' + Date.now();
      setToken(token);
      setUser(newUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      router.push('/dashboard');
    } catch (error) {
      console.error('[v0] Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
