// src/Components/FunctionCreationPage.js

import React, { useState, useContext } from "react";
import { AuthContext } from "../Contexts/AuthContext";
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import SchemaBuilder from "./SchemaBuilder"; // Import the updated SchemaBuilder
import api from "../Services/api";

const FunctionCreationPage = () => {
  // State for Input and Output JSON Schemas
  const [inputSchemaState, setInputSchemaState] = useState({
    type: "object",
    properties: {},
    required: [],
  });

  const [outputSchemaState, setOutputSchemaState] = useState({
    type: "object",
    properties: {},
    required: [],
  });

  // State for Prompt, Task, and Function Name
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState("");
  const [functionName, setFunctionName] = useState("");
  const { userEmail } = useContext(AuthContext);

  // State for Model and Temperature
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(1);

  // State for Test Set
  const [testSet, setTestSet] = useState([]);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [currentTestInput, setCurrentTestInput] = useState("");
  const [editTestIndex, setEditTestIndex] = useState(null);

  // Handlers for Schema Changes
  const handleInputSchemaChange = (updatedSchema) => {
    setInputSchemaState(updatedSchema);
  };

  const handleOutputSchemaChange = (updatedSchema) => {
    setOutputSchemaState(updatedSchema);
  };

  const handleCreateFunction = async () => {
    // Validate Function Name
    if (!functionName.trim()) {
      alert("Function Name is required.");
      return;
    }

    // Validate Prompt and Task
    if (!prompt.trim()) {
      alert("LLM Prompt is required.");
      return;
    }
    if (!task.trim()) {
      alert("Task Description is required.");
      return;
    }

    // Validate Schemas
    if (Object.keys(inputSchemaState.properties).length === 0) {
      alert("Input Schema must have at least one property.");
      return;
    }
    if (Object.keys(outputSchemaState.properties).length === 0) {
      alert("Output Schema must have at least one property.");
      return;
    }

    // Validate Test Set
    if (testSet.length === 0) {
      alert("At least one test case is required.");
      return;
    }

    const functionData = {
      name: functionName,
      task,
      prompt,
      input_schema: inputSchemaState,
      output_schema: outputSchemaState,
      test_set: testSet.map((test) => ({ input: JSON.parse(test) })),
      model,
      temperature,
    };
    try {
      const response = await api.post(`/users/${userEmail}/functions`, functionData);
      alert("Function Created Successfully");

      // After creating the function, call the evaluation API
      await api.post(
        `/users/${userEmail}/function/${response.data.functionId}/version/${response.data.versionId}/evaluate`
      );

      // Redirect or update UI as needed
      // For example, navigate to the function list page or reset the form
      // Here, we'll reset the form
      setFunctionName("");
      setTask("");
      setPrompt("");
      setInputSchemaState({
        type: "object",
        properties: {},
        required: [],
      });
      setOutputSchemaState({
        type: "object",
        properties: {},
        required: [],
      });
      setTestSet([]);
    } catch (error) {
      console.error(error);
      alert("Error creating function. Please check the console for details.");
    }
  };

  // Handlers for Test Set Dialog
  const handleOpenTestDialog = (index = null) => {
    if (index !== null) {
      setCurrentTestInput(testSet[index]);
      setEditTestIndex(index);
    } else {
      setCurrentTestInput("");
      setEditTestIndex(null);
    }
    setIsTestDialogOpen(true);
  };

  const handleCloseTestDialog = () => {
    setIsTestDialogOpen(false);
    setCurrentTestInput("");
    setEditTestIndex(null);
  };

  const handleSaveTest = () => {
    try {
      JSON.parse(currentTestInput); // Validate JSON
      if (editTestIndex !== null) {
        const newTestSet = [...testSet];
        newTestSet[editTestIndex] = currentTestInput;
        setTestSet(newTestSet);
      } else {
        setTestSet([...testSet, currentTestInput]);
      }
      handleCloseTestDialog();
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  const handleDeleteTest = (index) => {
    const newTestSet = [...testSet];
    newTestSet.splice(index, 1);
    setTestSet(newTestSet);
  };

  const handleGenerateTests = async () => {
    try {
      const numTests = 4; // You can allow the user to specify this number
      const response = await api.post('/generate_tests', {
        in_schema: inputSchemaState,
        num_tests: numTests,
        task: task,
      });
      const generatedTests = response.data.tests;
      setTestSet([...testSet, ...generatedTests.map(test => JSON.stringify(test, null, 2))]);
    } catch (error) {
      console.error('Error generating tests:', error);
      alert("Error generating tests");
    }
  };

  return (
    <Box sx={{ flexGrow: 1, padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create a New Function
      </Typography>
      <Grid container spacing={4}>
        {/* Input for Function Name */}
        <Grid item xs={12}>
          <TextField
            label="Function Name"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            fullWidth
            required
          />
        </Grid>

        {/* Input Schema Panel */}
        <Grid item xs={12} md={6}>
          <SchemaBuilder
            initialSchema={inputSchemaState}
            onSchemaChange={handleInputSchemaChange}
            schemaType="input"
          />
        </Grid>

        {/* Output Schema Panel */}
        <Grid item xs={12} md={6}>
          <SchemaBuilder
            initialSchema={outputSchemaState}
            onSchemaChange={handleOutputSchemaChange}
            schemaType="output"
          />
        </Grid>

        {/* Prompt and Task Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Prompt and Task
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="LLM Prompt"
                multiline
                rows={8}
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                fullWidth
              />
              <TextField
                label="Task Description"
                multiline
                rows={6}
                variant="outlined"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                fullWidth
              />
            </Box>
          </Paper>
        </Grid>

        {/* Model and Temperature Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Settings
            </Typography>
            <TextField
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
              helperText="Enter the OpenAI model to use"
            />
            <TextField
              label="Temperature"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              fullWidth
              helperText="Set the temperature for the model (0.0 - 2.0)"
              inputProps={{ min: 0.0, max: 2.0, step: 0.1 }}
              style={{ marginTop: '16px' }}
            />
          </Paper>
        </Grid>

        {/* Test Set Panel */}
        <Grid item xs={12}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Set
            </Typography>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutline />}
                onClick={() => handleOpenTestDialog()}
              >
                Add Test
              </Button>
              <Button variant="outlined" onClick={handleGenerateTests}>
                Generate Tests
              </Button>
            </Box>
            {testSet.length > 0 ? (
              testSet.map((test, index) => (
                <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
                  <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {test}
                  </pre>
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenTestDialog(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteTest(index)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography>No tests added yet.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Function Button */}
      <Box sx={{ marginTop: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={handleCreateFunction}
        >
          Create Function
        </Button>
      </Box>

      {/* Test Input Dialog */}
      <Dialog
        open={isTestDialogOpen}
        onClose={handleCloseTestDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editTestIndex !== null ? "Edit Test" : "Add Test"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Test Input (JSON)"
            multiline
            rows={10}
            variant="outlined"
            value={currentTestInput}
            onChange={(e) => setCurrentTestInput(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog}>Cancel</Button>
          <Button onClick={handleSaveTest} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FunctionCreationPage;
