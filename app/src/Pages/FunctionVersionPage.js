// src/Components/FunctionVersionPage.js

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VersionTree from "../Components/VersionTree";
import Logs from "../Components/Logs";
import api from "../Services/api";
import { AuthContext } from "../Contexts/AuthContext";
import PromptEditor from "../Components/PromptEditor";
import "./FunctionVersionPage.css";

const FunctionVersionPage = ({ isFlow = false }) => {
  const { functionId } = useParams();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [parameters, setParameters] = useState({});
  const { userEmail, tier } = useContext(AuthContext);

  const [functionData, setFunctionData] = useState(null);
  const [versionTreeKey, setVersionTreeKey] = useState(0); // to force re-render of version tree

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchFunctionData();
  }, []);

  useEffect(() => {
    if (!selectedVersion && functionData) {
      setSelectedVersion(functionData.current_version);
    }
    if (selectedVersion) {
      fetchParametersForVersion();
    }
    if (functionData && tier === "free") {
      setSelectedVersion(functionData.current_version);
    }
  }, [selectedVersion, functionData]);

  const fetchFunctionData = async () => {
    try {
      const response = await api.getFunctionData(functionId); // Use the new API method
      const func = response.data;
      setFunctionData(func);
    } catch (error) {
      console.error("Error fetching function data:", error);
      setSnackbar({
        open: true,
        message: "Error fetching function data.",
        severity: "error",
      });
    }
  };

  const fetchParametersForVersion = () => {
    if (!functionData) return;

    const versionData = functionData.version_map[selectedVersion];

    if (versionData) {
      setParameters(versionData.parameters || {});
      console.log("Parameters set to:", versionData.parameters);
    } else {
      setParameters({});
    }
  };

  const handleVersionSelect = async (versionName) => {
    setSelectedVersion(versionName);
  };

  const handleParameterChange = (key, value) => {
    setParameters({ ...parameters, [key]: value });
  };

  const handleCommit = async () => {
    try {
      const data = {
        version: selectedVersion,
        new_parameters: parameters,
      };

      await api.updateParameters(userEmail, functionId, data);
      setSnackbar({
        open: true,
        message: "Parameters updated successfully.",
        severity: "success",
      });
      // Refresh the version tree
      setVersionTreeKey(versionTreeKey + 1);
      fetchFunctionData();
    } catch (error) {
      console.error("Error updating parameters:", error);
      setSnackbar({
        open: true,
        message: "Error updating parameters.",
        severity: "error",
      });
    }
  };

  const handleDeploy = async () => {
    try {
      await api.deployVersion(userEmail, functionId, selectedVersion);
      setSnackbar({
        open: true,
        message: `Version ${selectedVersion} deployed successfully.`,
        severity: "success",
      });
      // Update functionData to reflect the new current_version
      fetchFunctionData();
    } catch (error) {
      console.error("Error deploying version:", error);
      setSnackbar({
        open: true,
        message: "Error deploying version.",
        severity: "error",
      });
    }
  };

  const handleCopyFunctionKey = (functionKey) => {
    navigator.clipboard
      .writeText(functionKey)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Function Key copied to clipboard!",
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setSnackbar({
          open: true,
          message: "Failed to copy Function Key.",
          severity: "error",
        });
      });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="function-version-container">
      <Grid container spacing={2}>
        {/* Conditionally render Sidebar with Version Tree based on tier */}
        {tier !== "free" && (
          <Grid item xs={12} md={3} className="sidebar">
            <Box className="sidebar-content">
              <VersionTree
                key={versionTreeKey}
                functionId={functionId}
                onVersionSelect={handleVersionSelect}
                currentVersion={
                  functionData ? functionData.current_version : null
                }
                setSnackbar={setSnackbar}
              />
            </Box>
          </Grid>
        )}

        {/* Main Content */}
        <Grid
          item
          xs={12}
          md={tier === "free" ? 12 : 9}
          className="main-content"
        >
          {selectedVersion && functionData ? (
            <Box className="main-content-box">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h5">
                  {tier === "free" ? "(For Version Tree Upgrade to Pro)" : ""}{" "}
                  Version: {selectedVersion}{" "}
                </Typography>
                <Box display="flex" alignItems="center" mb={2}></Box>
                {tier !== "free" && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDeploy}
                  >
                    Deploy
                  </Button>
                )}
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Tooltip title="Copy Function Key">
                  <IconButton
                    onClick={() =>
                      handleCopyFunctionKey(functionData.function_key)
                    } // Wrap in an arrow function
                    sx={{ ml: 1, fontSize: "small" }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" color="textSecondary">
                  {functionData.function_key}
                </Typography>
              </Box>
              <Box className="prompt-editor-box">
                {Object.keys(parameters).map((key) => {
                  const isPromptField = /prompt/i.test(key);
                  return isPromptField ? (
                    <PromptEditor
                      key={key}
                      label={key}
                      value={parameters[key]}
                      onChange={(value) => handleParameterChange(key, value)}
                    />
                  ) : (
                    <TextField
                      key={key}
                      label={key}
                      variant="outlined"
                      value={parameters[key]}
                      onChange={(e) =>
                        handleParameterChange(key, e.target.value)
                      }
                      fullWidth
                      style={{ marginTop: "16px" }}
                    />
                  );
                })}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCommit}
                  style={{ marginTop: "16px" }}
                >
                  {tier === "free" ? "Update" : "Commit Changes"}
                </Button>
              </Box>
              <Box className="logs-container">
                <Logs functionId={functionId} versionName={selectedVersion} />
              </Box>
            </Box>
          ) : (
            <Box className="eval-tests-container">
              <Typography variant="h5">
                Please select a version from the tree.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
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

export default FunctionVersionPage;
