// src/Components/FunctionVersionPage.js

import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Box, Grid, TextField, Button, Typography } from "@mui/material";
import VersionTree from "./VersionTree";
import EvalTests from "./EvalTests";
import api from "../Services/api";
import { AuthContext } from "../Contexts/AuthContext";
import "./FunctionVersionPage.css";

const FunctionVersionPage = () => {
  const { functionId } = useParams();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState("");
  const { userEmail } = useContext(AuthContext);

  const [functionData, setFunctionData] = useState(null);
  const [versionTreeKey, setVersionTreeKey] = useState(0); // to force re-render of version tree

  useEffect(() => {
    fetchFunctionData();
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      fetchParametersForVersion();
    }
  }, [selectedVersion]);

  const fetchFunctionData = async () => {
    try {
      const response = await api.get(
        `/users/${userEmail}/function/${functionId}`
      );
      const func = response.data.function;
      setFunctionData(func);
    } catch (error) {
      console.error("Error fetching function data:", error);
    }
  };

  const fetchParametersForVersion = () => {
    if (!functionData) return;

    // Navigate to the selected version node in the version tree
    const findVersionNode = (node, name) => {
      if (node.name === name) {
        return node;
      }
      if (node.children) {
        for (let child of node.children) {
          const result = findVersionNode(child, name);
          if (result) return result;
        }
      }
      return null;
    };

    const versionNode = findVersionNode(
      functionData.version_tree,
      selectedVersion
    );

    if (versionNode) {
      setPrompt(versionNode.prompt || "");
      setModel(versionNode.model || "");
      setTemperature(
        versionNode.temperature !== undefined ? versionNode.temperature : ""
      );
    } else {
      setPrompt("");
      setModel("");
      setTemperature("");
    }
  };

  const handleVersionSelect = async (versionName) => {
    setSelectedVersion(versionName);
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleModelChange = (event) => {
    setModel(event.target.value);
  };

  const handleTemperatureChange = (event) => {
    setTemperature(event.target.value);
  };

  const handleCommit = async () => {
    try {
      const data = {
        current_version_name: selectedVersion,
        new_prompt: prompt,
        new_model: model,
        new_temperature: parseFloat(temperature),
      };
      const response = await api.updateParameters(userEmail, functionId, data);
      // alert("New version created and evaluation added successfully");

      // Optionally, refresh the data to reflect the new version
      setVersionTreeKey(versionTreeKey + 1);
      fetchFunctionData();

      console.log("version", selectedVersion);
      await api.post(
        `/users/${userEmail}/function/${functionId}/version/${response.data.version}/evaluate`
      );
      // refresh the data to reflect the new version
      fetchFunctionData();
    } catch (error) {
      console.error("Error updating parameters:", error);
    }
  };

  const handleDeploy = async () => {
    try {
      await api.deployVersion(userEmail, functionId, selectedVersion);
      // alert(`Version ${selectedVersion} deployed successfully`);

      // Update functionData to reflect the new current_version
      fetchFunctionData();
    } catch (error) {
      console.error("Error deploying version:", error);
    }
  };

  return (
    <Box className="function-version-container">
      <Link to="/" className="back-link">
        ← Back to Functions
      </Link>
      <Grid container spacing={2}>
        {/* Sidebar with Version Tree */}
        <Grid item xs={12} md={3} className="sidebar">
          <Box className="sidebar-content">
            <VersionTree
              key={versionTreeKey}
              functionId={functionId}
              onVersionSelect={handleVersionSelect}
              currentVersion={
                functionData ? functionData.current_version : null
              }
            />
          </Box>
        </Grid>
        {/* Main Content with Prompt Editor and Evaluation Tests */}
        <Grid item xs={12} md={9} className="main-content">
          {selectedVersion ? (
            <Box className="main-content-box">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h5">Version: {selectedVersion}</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleDeploy}
                >
                  Deploy
                </Button>
              </Box>
              <Box className="prompt-editor-box">
                <TextField
                  label="Prompt"
                  multiline
                  rows={6}
                  variant="outlined"
                  value={prompt}
                  onChange={handlePromptChange}
                  fullWidth
                />
                <TextField
                  label="Model"
                  variant="outlined"
                  value={model}
                  onChange={handleModelChange}
                  fullWidth
                  style={{ marginTop: "16px" }}
                />
                <TextField
                  label="Temperature"
                  type="number"
                  variant="outlined"
                  value={temperature}
                  onChange={handleTemperatureChange}
                  fullWidth
                  style={{ marginTop: "16px" }}
                  inputProps={{ min: 0.0, max: 2.0, step: 0.1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCommit}
                  style={{ marginTop: "16px" }}
                >
                  Modify and Commit
                </Button>
              </Box>
              <Box className="eval-tests-container">
                <EvalTests
                  functionId={functionId}
                  versionName={selectedVersion}
                />
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
    </Box>
  );
};

export default FunctionVersionPage;
