import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Typography, Box } from '@mui/material';
import './ErrorBoundary.css';

function ErrorFallback({ error }) {
  return (
    <Box className="error-container">
      <Typography variant="h5" color="error">
        Something went wrong.
      </Typography>
      <Typography variant="body1" color="textSecondary">
        {error.toString()}
      </Typography>
    </Box>
  );
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
}
