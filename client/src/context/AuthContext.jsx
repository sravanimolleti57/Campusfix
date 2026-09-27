import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('campusfix_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusfix_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize token state with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('campusfix_token', token);
    } else {
      localStorage.removeItem('campusfix_token');
    }
  }, [token]);

  // Synchronize user state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('campusfix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campusfix_user');
    }
  }, [user]);

  // Load and verify current user on initial application mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('campusfix_token');
      if (storedToken) {
        try {
          const { data } = await authService.getMe();
          if (data.success && data.user) {
            setUser(data.user);
          }
        } catch (err) {
          console.warn('[Auth Initialization]: Token validation failed or expired', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authService.login({ email, password });
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: 'Invalid response from authentication server' };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, message };
    }
  };

  // Student registration handler
  const register = async (userData) => {
    setError(null);
    try {
      const { data } = await authService.register(userData);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please check the details entered.';
      setError(message);
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('campusfix_token');
    localStorage.removeItem('campusfix_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: Boolean(token && user),
        role: user?.role || null,
        login,
        register,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
