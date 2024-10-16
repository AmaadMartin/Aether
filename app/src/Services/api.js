// src/Services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Adjust if necessary
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Function to call the evaluation API
api.evaluateFunction = (userEmail, functionId, versionName) => {
  return api.post(`/users/${userEmail}/function/${functionId}/version/${versionName}/evaluate`);
};

// Function to update parameters
api.updateParameters = (userEmail, functionId, data) => {
  return api.post(`/users/${userEmail}/functions/${functionId}/update_parameters`, data);
};

// Function to deploy a version
api.deployVersion = (userEmail, functionId, versionName) => {
  return api.post(`/users/${userEmail}/functions/${functionId}/deploy_version`, {
    version_name: versionName,
  });
};

export default api;
