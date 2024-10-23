// src/Components/Logs.js

import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import "./Logs.css";
import api from "../Services/api";
import { AuthContext } from "../Contexts/AuthContext";
import CallItem from "./CallItem";

const Logs = ({ functionId, versionName }) => {
  const [callsForFunction, setCallsForFunction] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userEmail, tier } = useContext(AuthContext);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
      console.error("Error fetching calls:", error);
      setSnackbar({
        open: true,
        message: "Error fetching logs.",
        severity: "error",
      });
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
      <Box
        className="logs-message"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (callsForFunction.length === 0) {
    return (
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h5" color="error">
          No logs found yet
        </Typography>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Tooltip title="Refresh">
            <Button
              variant="text"
              color="primary"
              onClick={handleRefresh}
              sx={{
                minWidth: "64px",
                minHeight: "64px",
                borderRadius: "0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <RefreshIcon sx={{ fontSize: "36px" }} />{" "}
            </Button>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="logs-content">
      {/* Refresh Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Tooltip title="Refresh">
          <Button
            variant="text"
            color="primary"
            onClick={handleRefresh}
            sx={{
              minWidth: "64px",
              minHeight: "64px",
              borderRadius: "0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <RefreshIcon sx={{ fontSize: "36px" }} />{" "}
          </Button>
        </Tooltip>
      </Box>
      {callsForFunction.map((call, index) => (
        <CallItem key={index} call={call} index={index} />
      ))}

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Logs;
