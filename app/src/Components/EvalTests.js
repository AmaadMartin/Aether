// src/Components/EvalTests.js

import React, { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Button, // Import Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh'; // Import RefreshIcon
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './EvalTests.css';
import api from '../Services/api';
import { AuthContext } from '../Contexts/AuthContext';

const EvalTests = ({ functionId, versionName }) => {
  const [testsForFunction, setTestsForFunction] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userEmail } = useContext(AuthContext);

  useEffect(() => {
    if (functionId && versionName) {
      fetchTestsForFunctionAndVersion();
    }
  }, [functionId, versionName]);

  const fetchTestsForFunctionAndVersion = async () => {
    setLoading(true);
    try {
      // Fetch the function data from the API
      const func_response = await api.get(`/users/${userEmail}/function/${functionId}`);
      const func = func_response.data.function;

      if (!func) {
        setTestsForFunction([]);
        setLoading(false);
        return;
      }

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

      const versionNode = findVersionNode(func.version_tree, versionName);

      if (!versionNode || !versionNode.evals) {
        setTestsForFunction([]);
        setLoading(false);
        return;
      }

      setTestsForFunction(versionNode.evals);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTestsForFunction([]);
    } finally {
      setLoading(false);
    }
  };

  if (!functionId) {
    return (
      <Box className="eval-tests-message">
        <Typography variant="h5">Please select a function.</Typography>
      </Box>
    );
  }

  if (!versionName) {
    return (
      <Box className="eval-tests-message">
        <Typography variant="h5">Please select a version from the tree.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box className="eval-tests-message">
        <Typography variant="h5">Loading tests...</Typography>
      </Box>
    );
  }

  if (testsForFunction.length === 0) {
    return (
      <Box className="eval-tests-message">
        <Typography variant="h5" color="error">
          No tests found for this version.
        </Typography>
        {/* Add the Refresh button here */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchTestsForFunctionAndVersion}
          style={{ marginTop: '16px' }}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box className="eval-tests-content">
      {/* Add the Refresh button at the top */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<RefreshIcon />}
        onClick={fetchTestsForFunctionAndVersion}
        style={{ marginBottom: '16px' }}
      >
        Refresh
      </Button>
      {testsForFunction.map((test, index) => (
        <Accordion key={index} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}-content`}
            id={`panel${index}-header`}
          >
            <Typography>Test {index + 1}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Test Input */}
              <Grid item xs={12} md={6}>
                <Paper className="test-paper">
                  <Typography variant="h6" gutterBottom>
                    Input
                  </Typography>
                  <pre className="json-display">
                    {JSON.stringify(test.input, null, 2)}
                  </pre>
                </Paper>
              </Grid>
              {/* Test Output */}
              <Grid item xs={12} md={6}>
                <Paper className="test-paper">
                  <Typography variant="h6" gutterBottom>
                    Output
                  </Typography>
                  <pre className="json-display">
                    {JSON.stringify(test.output, null, 2)}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default EvalTests;
