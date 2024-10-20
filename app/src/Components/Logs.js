// src/Components/Logs.js

import React, { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './Logs.css';
import api from '../Services/api';
import { AuthContext } from '../Contexts/AuthContext';

const Logs = ({ functionId, versionName }) => {
  const [callsForFunction, setCallsForFunction] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userEmail, tier } = useContext(AuthContext);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (functionId && versionName) {
      fetchCallsForFunctionAndVersion();
    }
  }, [functionId, versionName]);

  const fetchCallsForFunctionAndVersion = async () => {
    setLoading(true);
    try {
      // Fetch the function data using the new API method
      const func_response = await api.getFunctionData(functionId);
      const func = func_response.data;

      if (!func) {
        setCallsForFunction([]);
        setLoading(false);
        return;
      }

      // Access the version data directly from version_map
      const versionData = func.version_map[versionName];

      if (!versionData || !versionData.calls) {
        setCallsForFunction([]);
        setLoading(false);
        return;
      }

      // Reverse the array to show the latest calls first
      setCallsForFunction(versionData.calls.slice().reverse());
    } catch (error) {
      console.error('Error fetching calls:', error);
      setSnackbar({ open: true, message: "Error fetching logs.", severity: "error" });
      setCallsForFunction([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCallsForFunctionAndVersion();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!functionId) {
    return (
      <Box className="logs-message">
        <Typography variant="h5">Please select a function.</Typography>
      </Box>
    );
  }

  if (!versionName) {
    return (
      <Box className="logs-message">
        <Typography variant="h5">Please select a version from the tree.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box className="logs-message">
        <Typography variant="h5">Loading logs...</Typography>
      </Box>
    );
  }

  if (callsForFunction.length === 0) {
    return (
      <Box className="logs-message">
        <Typography variant="h5" color="error">
          No logs found for this version yet.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          style={{ marginTop: '16px' }}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box className="logs-content">
      {/* Refresh Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        style={{ marginBottom: '16px' }}
      >
        Refresh
      </Button>
      {callsForFunction.map((call, index) => (
        <Accordion key={index} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
          >
            <Typography>
              Call {index + 1} - {new Date(call.timestamp).toLocaleString()} - Status: {call.status}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Input */}
              <Grid item xs={12} md={6}>
                <Paper className="call-paper">
                  <Typography variant="h6" gutterBottom>
                    Input
                  </Typography>
                  <pre className="json-display">
                    {JSON.stringify(call.inputs, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              {/* Output */}
              <Grid item xs={12} md={6}>
                <Paper className="call-paper">
                  <Typography variant="h6" gutterBottom>
                    Output
                  </Typography>
                  <pre className="json-display">
                    {JSON.stringify(call.outputs, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              {/* Logs */}
              {call.logs && call.logs.length > 0 && (
                <Grid item xs={12}>
                  <Paper className="call-paper">
                    <Typography variant="h6" gutterBottom>
                      Logs
                    </Typography>
                    <pre className="json-display">
                      {JSON.stringify(call.logs, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}
              {/* Evaluation */}
              {call.evaluation && Object.keys(call.evaluation).length > 0 ? (
                <Grid item xs={12}>
                  <Paper className="call-paper">
                    <Typography variant="h6" gutterBottom>
                      Evaluation
                    </Typography>
                    <pre className="json-display">
                      {JSON.stringify(call.evaluation, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              ) : (
                tier === "free" && (
                  <Grid item xs={12}>
                    <Paper className="call-paper">
                      <Typography variant="h6" gutterBottom>
                        Evaluation
                      </Typography>
                      <Typography variant="body1">
                        Upgrade to Pro to see evaluation metrics.
                      </Typography>
                    </Paper>
                  </Grid>
                )
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Logs;
