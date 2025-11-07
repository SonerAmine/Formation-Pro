import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on app start
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      try {
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token and get user data
        const response = await api.get('/auth/me');
        const userData = response.data.user; // FIX: Accéder à response.data.user
        
        console.log('✅ User data loaded:', userData); // Debug
        
        // S'assurer que l'objet user est stable
        setUser(prevUser => {
          // Éviter les re-renders inutiles si les données n'ont pas changé
          if (JSON.stringify(prevUser) === JSON.stringify(userData)) {
            return prevUser;
          }
          return userData;
        });
        setToken(storedToken);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Token is invalid, remove it
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
      }
    }
    
    setLoading(false);
  };

  const login = async (email, motDePasse) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        motDePasse
      });

      const { token: newToken, user: userData } = response.data;

      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user data
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);

      const { token: newToken, user: newUser } = response.data;

      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user data
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential, clientId) => {
    try {
      const response = await api.post('/auth/google', {
        credential,
        clientId
      });

      const { token: newToken, user: userData } = response.data;

      // Store token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user data
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Remove token from storage and state
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    // Remove token from API headers
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData) => {
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...userData
      };
      
      // Debug: Log the updated user data
      console.log('🔄 User updated:', updatedUser);
      
      return updatedUser;
    });
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const hasSpecialOffer = () => {
    return user?.offresSpeciales > 0;
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    hasSpecialOffer,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
