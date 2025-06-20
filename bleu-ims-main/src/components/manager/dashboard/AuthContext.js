// Create the AuthContext with default values
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

// Utility function to validate JWT token expiration
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  } catch (error) {
    return false;
  }
}

// Utility function to get Authorization headers for API calls
export function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  if (token && isTokenValid(token)) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

// AuthProvider component to wrap the app and provide auth state
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check localStorage for token on mount to set login state
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && isTokenValid(token)) {
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
    }
  }, []);

  // Login function to set login state and store token
  const login = (token) => {
    localStorage.setItem('authToken', token);
    setIsLoggedIn(true);
  };

  // Logout function to clear login state and remove token
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  // Return the context provider with the auth state and functions
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};