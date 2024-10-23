import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Contexts/AuthContext';
import PropTypes from 'prop-types';
import CircularProgress from "@mui/material/CircularProgress";
import { Box } from "@mui/material";

const PrivateRoute = ({ children }) => {
  const { userEmail, loading } = useContext(AuthContext);

  if (loading) {
    return (
            <Box
        className="logs-message"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <CircularProgress />
      </Box>
    );// Or a spinner component
  }

  if (!userEmail) {
    return <Navigate to="/" />; // Redirect to landing page
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
