import React, { createContext, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userId, username) => {
    setUser({ id: userId, username });
  };

  const logout = () => {
    setUser(null);
  };

  const refreshUserData = async () => {
    if (user?.id) {
      try {
        const response = await axios.get(`http://192.168.1.6:5000/personal-data/${user.id}`);
        setUser(prevUser => ({ ...prevUser, ...response.data })); 
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUserData  }}>
      {children}
    </AuthContext.Provider>
  );
};