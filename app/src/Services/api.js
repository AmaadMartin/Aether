// src/Services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Adjust if necessary
});

// Add a request interceptor to include the token and API key
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('api_key');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
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
    version: versionName,
  });
};

// New function to get function data by function key
api.getFunctionData = (functionKey) => {
  return api.get(`/function_data/${functionKey}`);
};

// Function to create a call
api.createCall = (functionKey, version, data) => {
  return api.post(`/create_call/${functionKey}/${version}`, data);
};

// Function to update a call
api.updateCall = (callId, data) => {
  return api.post(`/update_call/${callId}`, data);
};

export default api;
