// src/Contexts/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [apiKey, setApiKey] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('email');
    const storedApiKey = localStorage.getItem('api_key');
    if (email) {
      setUserEmail(email);
    }
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userEmail, setUserEmail, apiKey, setApiKey }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
