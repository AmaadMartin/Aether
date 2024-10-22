// src/Components/FunctionCreationPage.js

import React, { useState, useContext } from 'react';
import { useParams, Link } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Paper,
  Grid,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { AuthContext } from '../Contexts/AuthContext';
import api from '../Services/api';
import SchemaBuilder from './SchemaBuilder';

const FunctionCreationPage = ({ isFlow }) => {
  const { userEmail } = useContext(AuthContext);

  const [functionName, setFunctionName] = useState('');
  const [functionTask, setFunctionTask] = useState('');
  const [functionType, setFunctionType] = useState('chat_completion');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [inputSchema, setInputSchema] = useState(null);
  const [outputSchema, setOutputSchema] = useState(null);
  const [testSet, setTestSet] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [parameters, setParameters] = useState([]);

  // Snackbar state variables
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCreateFunction = async () => {
    // Build the function data object
    const functionData = {
      name: functionName,
      task: functionTask,
      type: isFlow ? 'flow' : functionType,
      test_set: testSet,
    };

    console.log("model", model);

    if (!isFlow) {
      functionData.prompt = prompt;
      functionData.model = model;
      functionData.temperature = parseFloat(temperature);
      functionData.input_schema = inputSchema;
      functionData.output_schema = outputSchema;
      functionData.metrics = metrics;
    } else if (isFlow) {
      // For custom functions, include metrics and parameters
      functionData.metrics = metrics;
      // Convert parameters array to an object
      const parametersObject = parameters.reduce((obj, param) => {
        if (param.name) {
          obj[param.name] = param.value;
        }
        return obj;
      }, {});
      functionData.parameters = parametersObject;
    }

    try {
      // Make API call to create the function
      await api.post(`/users/${encodeURIComponent(userEmail)}/functions`, functionData);
      setSnackbar({ open: true, message: 'Function created successfully!', severity: 'success' });
      // Reset form fields
      resetForm();
    } catch (error) {
      console.error('Error creating function:', error);
      setSnackbar({ open: true, message: 'Failed to create function.', severity: 'error' });
    }
  };

  const resetForm = () => {
    setFunctionName('');
    setFunctionTask('');
    setFunctionType(isFlow ? 'flow' : 'chat_completion');
    setPrompt('');
    setModel('gpt-4o-mini');
    setTemperature(0.7);
    setInputSchema(null);
    setOutputSchema(null);
    setTestSet([]);
    setMetrics([]);
    setParameters([]);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Functions to handle adding/removing metrics
  const addMetric = () => {
    setMetrics([...metrics, '']);
  };

  const removeMetric = (index) => {
    const newMetrics = metrics.filter((_, idx) => idx !== index);
    setMetrics(newMetrics);
  };

  const updateMetric = (index, value) => {
    const newMetrics = [...metrics];
    newMetrics[index] = value;
    setMetrics(newMetrics);
  };

  // Functions to handle adding/removing parameters
  const addParameter = () => {
    setParameters([...parameters, { name: '', value: '' }]);
  };

  const removeParameter = (index) => {
    const newParameters = parameters.filter((_, idx) => idx !== index);
    setParameters(newParameters);
  };

  const updateParameterName = (index, value) => {
    const newParameters = [...parameters];
    newParameters[index].name = value;
    setParameters(newParameters);
  };

  const updateParameterValue = (index, value) => {
    const newParameters = [...parameters];
    newParameters[index].value = value;
    setParameters(newParameters);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New {isFlow ? 'Flow' : 'Function'}
      </Typography>

      {/* Function Name */}
      <TextField
        label= {`${isFlow ? 'Flow Name' : 'Function Name'}`}
        value={functionName}
        onChange={(e) => setFunctionName(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Function Task */}
      <TextField
        label={`${isFlow ? 'Flow Task' : 'Function Task'}`}
        value={functionTask}
        onChange={(e) => setFunctionTask(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Conditional Fields Based on Function Type */}
      {!isFlow && (
        <>
          {/* Prompt */}
          <TextField
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />

          {/* Model */}
          <TextField
            label="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            fullWidth
            margin="normal"
          />

          {/* Temperature */}
          <TextField
            label="Temperature"
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            fullWidth
            margin="normal"
          />

          {/* Input Schema */}
          <SchemaBuilder
            initialSchema={inputSchema}
            onMetricsChange={setMetrics}
            onSchemaChange={setInputSchema}
            schemaType="input"
          />

          {/* Output Schema */}
          <SchemaBuilder
            initialSchema={outputSchema}
            onMetricsChange={setMetrics}
            onSchemaChange={setOutputSchema}
            schemaType="output"
          />
        </>
      )}

      {isFlow && (
        <>
          {/* Parameters for Custom Function */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6">Parameters</Typography>
            {parameters.map((param, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}
              >
                <TextField
                  label="Parameter Name"
                  value={param.name}
                  onChange={(e) => updateParameterName(index, e.target.value)}
                  sx={{ marginRight: 1, flex: 1 }}
                />
                <TextField
                  label="Parameter Value"
                  value={param.value}
                  onChange={(e) => updateParameterValue(index, e.target.value)}
                  sx={{ marginRight: 1, flex: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeParameter(index)}
                  sx={{ marginLeft: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={addParameter}
              startIcon={<AddIcon />}
              sx={{ marginTop: 1 }}
            >
              Add Parameter
            </Button>
          </Box>

          {/* Metrics for Custom Function */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6">Output Metrics</Typography>
            {metrics.map((metric, index) => (
              <Box
                key={index}
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}
              >
                <TextField
                  label={`Metric ${index + 1}`}
                  value={metric}
                  onChange={(e) => updateMetric(index, e.target.value)}
                  fullWidth
                />
                <IconButton
                  color="error"
                  onClick={() => removeMetric(index)}
                  sx={{ marginLeft: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={addMetric}
              startIcon={<AddIcon />}
              sx={{ marginTop: 1 }}
            >
              Add Metric
            </Button>
          </Box>
        </>
      )}

      {/* Create Function Button */}
      <Box sx={{ marginTop: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={handleCreateFunction}
        >
          Create {isFlow ? 'Flow' : 'Function'}
        </Button>
      </Box>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FunctionCreationPage;
