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
          // setError('User is not authenticated.');
          console.log('User is not authenticated.');
          // initializeAuth();
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

  // Logout Function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('api_key');

    // Reset context state
    setUserEmail(null);
    setApiKey(null);
    setTier('Free');

    // Optionally, remove API key from headers
    delete api.defaults.headers.common['X-API-Key'];
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
    logout, // Add logout to context
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
