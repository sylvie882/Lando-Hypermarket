// lib/auth.ts
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryStaff: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<boolean>; // Add this line
  refreshUser: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, data: { password: string; password_confirmation: string }) => Promise<boolean>;
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  checkRole: () => Promise<any>;
  syncAuthToCookies: (token: string, user: User) => void;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Sync to cookies for middleware
        syncAuthToCookies(storedToken, JSON.parse(storedUser));
        
        // Verify token is still valid
        await refreshUser();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sync auth data to cookies (for middleware access)
  const syncAuthToCookies = (token: string, user: User) => {
    try {
      // Set token and user cookies
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}`;
    } catch (error) {
      console.error('Failed to sync auth to cookies:', error);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cookies too
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  };

  const refreshUser = async (): Promise<boolean> => {
    try {
      const response = await api.auth.getUser();
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Sync to cookies
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        syncAuthToCookies(currentToken, userData);
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // Only logout if it's an auth error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        await logout();
      }
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.login({ email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Sync to cookies for middleware
      syncAuthToCookies(token, user);
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.adminLogin({ email, password });
      const { token, user } = response.data;
      
      // Check if user is admin
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return false;
      }
      
      setToken(token);
      setUser(user);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Sync to cookies for middleware
      syncAuthToCookies(token, user);
      
      toast.success('Admin login successful!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Admin login failed. Please check your credentials.';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.register(data);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Sync to cookies for middleware
      syncAuthToCookies(token, user);
      
      toast.success('Registration successful! Please check your email for verification.');
      return true;
    } catch (error: any) {
      const errors = error.response?.data?.errors;
      let errorMessage = 'Registration failed';
      
      if (errors) {
        // Handle validation errors
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');
      // Redirect based on current path
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/auth/login';
      }
    }
  };

  const updateProfile = async (data: any): Promise<boolean> => {
    try {
      const response = await api.auth.updateProfile(data);
      const updatedUser = response.data.user || response.data;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Sync updated user to cookies
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        syncAuthToCookies(currentToken, updatedUser);
      }
      
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Update failed';
      toast.error(errorMessage);
      return false;
    }
  };

  // ADD THIS updateUser FUNCTION RIGHT HERE:
const updateUser = async (userData: Partial<User>): Promise<boolean> => {
  try {
    // Update local state
    setUser(prev => prev ? { ...prev, ...userData } : userData as User);
    
    // Update localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Sync to cookies
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        syncAuthToCookies(currentToken, updatedUser);
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('Failed to update user data:', error);
    return false;
  }
};

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      await api.auth.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      toast.error(errorMessage);
      return false;
    }
  };

  const resetPassword = async (token: string, data: {
    password: string;
    password_confirmation: string;
  }): Promise<boolean> => {
    try {
      await api.auth.resetPassword({ token, ...data });
      toast.success('Password reset successful!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      toast.error(errorMessage);
      return false;
    }
  };

  const changePassword = async (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<boolean> => {
    try {
      await api.auth.changePassword(data);
      toast.success('Password changed successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      return false;
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      await api.auth.verifyEmail(token);
      toast.success('Email verified successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    try {
      await api.auth.resendVerificationEmail(email);
      toast.success('Verification email sent!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
      return false;
    }
  };

  const checkRole = async (): Promise<any> => {
    try {
      const response = await api.auth.checkRole();
      return response.data;
    } catch (error: any) {
      console.error('Failed to check role:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isDeliveryStaff: user?.role === 'delivery_staff',
    isCustomer: user?.role === 'customer' || !user?.role, // Default to customer if no role specified
    login,
    adminLogin,
    register,
    logout,
    updateProfile,
    updateUser,
    refreshUser,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    checkRole,
    syncAuthToCookies,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};