import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
        } catch (error) {
          console.error("Auth Init Failed:", error);
          localStorage.removeItem('accessToken'); // Cleanup invalid token
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    // Save tokens
    localStorage.setItem('accessToken', res.tokens.accessToken);
    localStorage.setItem('refreshToken', res.tokens.refreshToken);
    // Set user state
    setUser(res.data.user);
    return res;
  };

  const logout = () => {
    authService.logout(); // Call API (fire & forget)
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);