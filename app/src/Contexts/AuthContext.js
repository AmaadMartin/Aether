// src/Contexts/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import api from '../Services/api'; // Ensure you have an API service set up
import PropTypes from 'prop-types';

// Create the AuthContext
export const AuthContext = createContext();

// AuthProvider Component
const AuthProvider = ({ children }) => {
  // State variables for user information
  const [userEmail, setUserEmail] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [tier, setTier] = useState('Free'); // Default tier

  // State variables for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to initialize user data on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Retrieve email and API key from localStorage
        const email = localStorage.getItem('email');
        const storedApiKey = localStorage.getItem('api_key');

        if (email && storedApiKey) {
          setUserEmail(email);
          setApiKey(storedApiKey);

          // Set the API key in the headers for authenticated requests
          api.defaults.headers.common['X-API-Key'] = storedApiKey;

          // Fetch user data from the backend to get the current tier
          const response = await api.get(`/users/${encodeURIComponent(email)}`);
          const userData = response.data;

          // Update the tier state; default to 'Free' if not set
          setTier(userData.tier || 'Free');
        } else {
          // If email or API key is missing, handle accordingly
          setError('User is not authenticated.');
        }
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
        setError('Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to update the tier (useful when upgrading/downgrading)
  const updateTier = (newTier) => {
    setTier(newTier);
    // Optionally, update the tier in localStorage or make an API call if needed
  };

  // Context value to be provided to consuming components
  const contextValue = {
    userEmail,
    setUserEmail,
    apiKey,
    setApiKey,
    tier,
    setTier: updateTier,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// PropTypes for type checking
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
