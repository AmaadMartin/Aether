// src/Components/LoginPage.js

import React, { useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../Services/api';
import { AuthContext } from '../Contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUserEmail, setApiKey } = useContext(AuthContext);

  const handleLoginSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;

    try {
      // Send the ID token to the backend
      const response = await api.post('/auth/login', {
        token: credential,
      });
      console.log('Login successful', response);
      const email = response.data.email;
      const apiKey = response.data.api_key;
      console.log('Email', email);
      console.log('API Key', apiKey);

      // Store the user data and token in localStorage or context
      localStorage.setItem('token', credential);
      localStorage.setItem('email', email);
      localStorage.setItem('api_key', apiKey);

      setUserEmail(email);
      setApiKey(apiKey);

      // Navigate to the main app
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  return (
    <div>
      <h1>Login</h1>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
    </div>
  );
};

export default LoginPage;
