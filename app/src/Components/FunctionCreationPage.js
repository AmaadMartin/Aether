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
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

// Import the attribute schemas
import {
  attributeSchema,
  outputAttributeSchema,
} from "../Schemas/attributeSchema";

// Import the API service
import api from "../Services/api";

const FunctionCreationPage = () => {
  // State for Input and Output JSON Schemas
  const [inputSchemaState, setInputSchemaState] = useState({
    title: "Input Schema",
    type: "object",
    properties: {},
  });

  const [outputSchemaState, setOutputSchemaState] = useState({
    title: "Output Schema",
    type: "object",
    properties: {},
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

  // Handlers for schema changes
  const handleInputSchemaChange = ({ formData }) => {
    const properties = {};
    if (formData.attributes) {
      formData.attributes.forEach((attr) => {
        properties[attr.name] = convertAttributeToSchema(attr);
      });
    }

    setInputSchemaState({
      title: "Input Schema",
      type: "object",
      properties,
    });
  };

  const handleOutputSchemaChange = ({ formData }) => {
    const properties = {};
    if (formData.attributes) {
      formData.attributes.forEach((attr) => {
        properties[attr.name] = convertAttributeToSchema(attr);
      });
    }

    setOutputSchemaState({
      title: "Output Schema",
      type: "object",
      properties,
    });
  };

  // Function to convert a single attribute to schema property
  const convertAttributeToSchema = (attr) => {
    const propertySchema = {
      type: attr.type,
    };

    // Include desiredProperties in the schema for output attributes
    if (attr.desiredProperties) {
      propertySchema.desiredProperties = attr.desiredProperties;
    }

    if (attr.type === "object" && attr.properties) {
      propertySchema.properties = convertAttributesToSchema(attr.properties);
    } else if (attr.type === "array" && attr.items) {
      propertySchema.items = {
        type: "object",
        properties: convertAttributesToSchema(attr.items),
      };
    }
    return propertySchema;
  };

  // Recursive function to convert attributes array to schema properties
  const convertAttributesToSchema = (attributes) => {
    const schemaProperties = {};
    if (!attributes) return schemaProperties;
    attributes.forEach((attr) => {
      schemaProperties[attr.name] = convertAttributeToSchema(attr);
    });
    return schemaProperties;
  };

  const handleCreateFunction = async () => {
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
    } catch (error) {
      console.error(error);
      alert("Error creating function");
    }
  };

  // UI Schema for managing attributes
  const attributesUISchema = {
    items: {
      "ui:options": {
        addable: true,
        orderable: false,
        removable: true,
      },
      properties: {
        name: {
          "ui:autofocus": true,
          "ui:placeholder": "Enter attribute name",
        },
        type: {
          "ui:widget": "select",
        },
        desiredProperties: {
          "ui:options": {
            addable: true,
            orderable: false,
            removable: true,
          },
          items: {
            "ui:emptyValue": "",
          },
        },
        properties: {
          "ui:options": {
            orderable: false,
            removable: true,
          },
        },
        items: {
          "ui:options": {
            orderable: false,
            removable: true,
          },
        },
      },
    },
  };

  // Custom Array Field Template with Add and Remove buttons
  const CustomArrayFieldTemplate = (props) => {
    const { items, canAdd, onAddClick } = props;
    return (
      <div>
        {items.map((element) => (
          <Box key={element.key} className="attribute-box">
            <Paper className="attribute-paper">
              <IconButton
                aria-label="remove attribute"
                onClick={element.onDropIndexClick(element.index)}
                className="remove-button"
                color="error"
              >
                <RemoveCircleOutline />
              </IconButton>
              {element.children}
            </Paper>
          </Box>
        ))}
        {canAdd && (
          <Box className="add-attribute-button-container">
            <Button
              variant="outlined"
              startIcon={<AddCircleOutline />}
              onClick={onAddClick}
            >
              Add Attribute
            </Button>
          </Box>
        )}
      </div>
    );
  };

  // Complete schema for input form including definitions
  const inputFormSchema = {
    type: "object",
    title: "Input Attributes",
    properties: {
      attributes: {
        type: "array",
        title: "Attributes",
        items: {
          $ref: "#/definitions/attribute",
        },
        uniqueItems: true,
      },
    },
    definitions: {
      attribute: attributeSchema,
    },
  };

  // Complete schema for output form including definitions
  const outputFormSchema = {
    type: "object",
    name: "Output",
    properties: {
      attributes: {
        type: "array",
        title: "Attributes",
        items: {
          $ref: "#/definitions/outputAttribute",
        },
        uniqueItems: true,
      },
    },
    definitions: {
      attribute: attributeSchema,
      outputAttribute: outputAttributeSchema,
    },
  };

  // Prepare formData for input
  const inputFormData = {
    attributes: prepareFormData(inputSchemaState.properties),
  };

  // Prepare formData for output
  const outputFormData = {
    attributes: prepareFormData(outputSchemaState.properties),
  };

  // Function to prepare formData from schema properties
  function prepareFormData(properties) {
    if (!properties) return [];
    return Object.keys(properties).map((key) => {
      const prop = properties[key];
      return {
        name: key,
        type: prop.type,
        desiredProperties: prop.desiredProperties || [],
        properties: prepareFormData(prop.properties),
        items: prepareFormData(prop.items ? prop.items.properties : {}),
      };
    });
  }

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

  const generateDummyData = (schema) => {
    const data = {};
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const prop = schema.properties[key];
        switch (prop.type) {
          case "string":
            data[key] = "string";
            break;
          case "number":
            data[key] = 0;
            break;
          case "boolean":
            data[key] = true;
            break;
          case "object":
            data[key] = generateDummyData(prop);
            break;
          case "array":
            data[key] = [generateDummyData(prop.items)];
            break;
          default:
            data[key] = null;
        }
      });
    }
    return data;
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
        <Grid item xs={12} md={4}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Input JSON Schema
            </Typography>
            <Form
              schema={inputFormSchema}
              uiSchema={attributesUISchema}
              onChange={handleInputSchemaChange}
              formData={inputFormData}
              ArrayFieldTemplate={CustomArrayFieldTemplate}
              validator={validator}
            >
              {/* The submit button is hidden */}
              <Button type="submit" style={{ display: "none" }}>
                Submit
              </Button>
            </Form>
          </Paper>
        </Grid>

        {/* Prompt and Task Panel */}
        <Grid item xs={12} md={4}>
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

        {/* Output Schema Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Output JSON Schema
            </Typography>
            <Form
              schema={outputFormSchema}
              uiSchema={attributesUISchema}
              onChange={handleOutputSchemaChange}
              formData={outputFormData}
              ArrayFieldTemplate={CustomArrayFieldTemplate}
              validator={validator}
            >
              {/* The submit button is hidden */}
              <Button type="submit" style={{ display: "none" }}>
                Submit
              </Button>
            </Form>
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
