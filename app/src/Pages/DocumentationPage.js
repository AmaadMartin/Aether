// src/Components/DocumentationPage.js

import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Link, Routes, Route, useLocation } from "react-router-dom";

const sections = [
  { label: "Client", path: "client" },
  { label: "Flows", path: "flows" },
  { label: "Functions", path: "functions" },
  { label: "Calls", path: "calls" },
];

const DocumentationPage = () => {
  const location = useLocation();

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: "200px",
          borderRight: "1px solid #ccc",
          padding: 2,
          backgroundColor: "#f9f9f9",
          height: "157vh",
          minHeight: "157vh",
          maxHeight: "157vh",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Classes
        </Typography>
        <List component="nav">
          {sections.map((section) => (
            <ListItem
              button
              key={section.path}
              component={Link}
              to={`/docs/${section.path}`}
              selected={location.pathname === `/docs/${section.path}`}
            >
              <ListItemText primary={section.label} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Routes>
          <Route path="client" element={<ClientDoc />} />
          <Route path="flows" element={<FlowsDoc />} />
          <Route path="functions" element={<FunctionsDoc />} />
          <Route path="calls" element={<CallsDoc />} />
          {/* Default Route */}
          <Route path="*" element={<ClientDoc />} />
        </Routes>
      </Box>
    </Box>
  );
};

// Documentation Sections
const ClientDoc = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Client
    </Typography>
    <Typography variant="body1" paragraph>
      The Aether client serves as the main entry point to interact with the
      Aether API. To get started, initialize the client with your API key:
    </Typography>
    <Box
      component="pre"
      sx={{
        backgroundColor: "#f5f5f5",
        padding: 2,
        borderRadius: 1,
        overflowX: "auto",
      }}
    >
      {`from aetherllm import Aether
  
  # Replace AETHER_API_KEY with your actual API key
  aether = Aether(AETHER_API_KEY)`}
    </Box>
    <Typography variant="body1" paragraph>
      Once initialized, you can use the `aether` instance to create and manage
      functions and flows.
    </Typography>
    {/* Add more detailed content as needed */}
  </Box>
);

const FlowsDoc = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Flows
    </Typography>
    <Typography variant="body1" paragraph>
      Flows allow you to define custom workflows that can include multiple
      functions and custom logic. Here's how to create and use flows:
    </Typography>
    <Box
      component="pre"
      sx={{
        backgroundColor: "#f5f5f5",
        padding: 2,
        borderRadius: 1,
        overflowX: "auto",
      }}
    >
      {`from aetherllm import Aether
  
  # Initialize the Aether client
  aether = Aether(AETHER_API_KEY)
  
  # Initialize the flow
  flow = aether(FLOW_KEY)
  
  def custom_function(input_json):
      # Initialize the call
      call = flow.init_call()

      # Get flow parameters
      parameter = flow["parameter"]
      parameter_2 = flow["parameter_2"]
  
      call.log("Running custom function")
      call.input("input", input_json)
      
      # Custom logic here
      output = "Processed data"
  
      call.output("output", output)
      call.status("completed")
  
      call.eval()
      return output
  
  custom_function("test_input")`}
    </Box>
    <Typography variant="body1" paragraph>
      In this example, we define a custom function that uses the flow to log
      inputs and outputs, and to manage the call's status.
    </Typography>
    <Box sx={{ mt: 12 }}>
      <Typography variant="h4" component="h3" gutterBottom align="center">
        Demo
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
          // Make the iframe responsive
          position: "relative",
          paddingTop: "56.25%", // 16:9 Aspect Ratio
        }}
      >
        <iframe
          src="https://www.youtube.com/embed/Yaj48Xx4j5w?si=Vg8zbr4dX260nQpI"
          title="Flow Demo"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        ></iframe>
      </Box>
    </Box>
  </Box>
);

const FunctionsDoc = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Functions
    </Typography>
    <Typography variant="body1" paragraph>
      Functions represent individual units of work in Aether. They are typically
      associated with a prompt, model, and parameters.
    </Typography>
    <Typography variant="body1" paragraph>
      To initialize and call a function:
    </Typography>
    <Box
      component="pre"
      sx={{
        backgroundColor: "#f5f5f5",
        padding: 2,
        borderRadius: 1,
        overflowX: "auto",
      }}
    >
      {`from aetherllm import Aether
  
  # Initialize the Aether client
  aether = Aether(AETHER_API_KEY)
  
  # Initialize the function with your OpenAI API key
  function = aether(FUNCTION_KEY, openai_key=OPENAI_API_KEY)
  
  # Call the function with input data
  output = function({
      "Article": "This is an article...",
  })`}
    </Box>
    <Typography variant="body1" paragraph>
      The function will process the input using the defined prompt and model,
      and return the output.
    </Typography>
    {/* Add more detailed content as needed */}
  </Box>
);

const CallsDoc = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Calls
    </Typography>
    <Typography variant="body1" paragraph>
      Calls represent the execution of a function or flow. They allow you to
      track inputs, outputs, logs, and status.
    </Typography>
    <Typography variant="body1" paragraph>
      Here's how to work with calls:
    </Typography>
    <Box
      component="pre"
      sx={{
        backgroundColor: "#f5f5f5",
        padding: 2,
        borderRadius: 1,
        overflowX: "auto",
      }}
    >
      {`# Initialize the call
  call = flow.init_call()
  
  # Log messages
  call.log("Starting call execution")
  
  # Add inputs
  call.input("input_name", input_data)
  
  # Execute custom logic or function call
  # ...
  
  # Add outputs
  call.output("output_name", output_data)
  
  # Update status
  call.status("completed")
  
  # Trigger evaluation
  call.eval()`}
    </Box>
    <Typography variant="body1" paragraph>
      The `call` object provides methods to log messages, set inputs and
      outputs, update status, and trigger evaluations.
    </Typography>
    {/* Add more detailed content as needed */}
  </Box>
);

export default DocumentationPage;
