// src/Components/PrivateRoute.js

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { userEmail } = useContext(AuthContext);

  if (!userEmail) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
