// src/Components/CallItem.js

import React, { useContext, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoIcon from "@mui/icons-material/Info";
import { AuthContext } from "../Contexts/AuthContext";
import "./CallItem.css";

const CallItem = ({ call, index }) => {
  const { tier } = useContext(AuthContext);

  // State for logs modal
  const [logsOpen, setLogsOpen] = useState(false);

  // State for analysis modal
  const [analysisOpen, setAnalysisOpen] = useState(false);

  // Function to open logs modal
  const handleLogsOpen = (event) => {
    event.stopPropagation(); // Prevent accordion toggle
    setLogsOpen(true);
  };

  // Function to close logs modal
  const handleLogsClose = () => {
    setLogsOpen(false);
  };

  // Function to open analysis modal
  const handleAnalysisOpen = (event) => {
    event.stopPropagation(); // Prevent accordion toggle
    setAnalysisOpen(true);
  };

  // Function to close analysis modal
  const handleAnalysisClose = () => {
    setAnalysisOpen(false);
  };

  // Function to check if an object is empty
  const isEmptyObject = (obj) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  };

  // Function to get color based on score value
  const getScoreColor = (value) => {
    // Assuming value is between 1 and 100
    const hue = (value * 120) / 100; // 0 (red) to 120 (green)
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <Accordion key={index} defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${index}-content`}
        id={`panel${index}-header`}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography>
            Call {index + 1} - {new Date(call.timestamp).toLocaleString()} -
            Status: {call.status}
          </Typography>
          <Box>
            {call.evaluation && call.evaluation.analysis && (
              <IconButton
                onClick={(event) => handleAnalysisOpen(event)}
                aria-label="View Analysis"
              >
                <InfoIcon />
              </IconButton>
            )}
            {call.logs && call.logs.length > 0 && (
              <IconButton
                onClick={(event) => handleLogsOpen(event)}
                aria-label="View Logs"
              >
                <VisibilityIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box display="flex" width="100%">
          {/* Input */}
          <Paper
            className="call-paper"
            sx={{ flex: 1, marginRight: "8px", maxHeight: "300px", overflow: "auto" }}
          >
            <Typography variant="h6" gutterBottom>
              Input
            </Typography>
            {isEmptyObject(call.inputs) ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100px"
              >
                <CircularProgress />
              </Box>
            ) : (
              <pre className="json-display">
                {JSON.stringify(call.inputs, null, 2)}
              </pre>
            )}
          </Paper>
          {/* Output */}
          <Paper
            className="call-paper"
            sx={{ flex: 1, marginX: "8px", maxHeight: "300px", overflow: "auto" }}
          >
            <Typography variant="h6" gutterBottom>
              Output
            </Typography>
            {isEmptyObject(call.outputs) ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100px"
              >
                <CircularProgress />
              </Box>
            ) : (
              <pre className="json-display">
                {JSON.stringify(call.outputs, null, 2)}
              </pre>
            )}
          </Paper>
          {/* Evaluation Scores */}
          {call.evaluation && call.evaluation.scores ? (
            <Paper
              className="call-paper"
              sx={{
                width: "200px",
                marginLeft: "8px",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Scores
              </Typography>
              {Object.entries(call.evaluation.scores).map(([metric, value]) => (
                <Paper
                  key={metric}
                  sx={{
                    padding: "8px",
                    marginBottom: "8px",
                    backgroundColor: getScoreColor(value),
                  }}
                >
                  <Typography variant="body1">
                    {metric}: {value}
                  </Typography>
                </Paper>
              ))}
            </Paper>
          ) : (
            tier === "free" && (
              <Paper
                className="call-paper"
                sx={{
                  width: "200px",
                  marginLeft: "8px",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Scores
                </Typography>
                <Typography variant="body1">
                  Upgrade to Pro to see evaluation metrics.
                </Typography>
              </Paper>
            )
          )}
        </Box>
      </AccordionDetails>

      {/* Logs Modal */}
      <Dialog
        open={logsOpen}
        onClose={handleLogsClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Logs</DialogTitle>
        <DialogContent>
          <pre className="json-display">
            {JSON.stringify(call.logs, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogsClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Modal */}
      <Dialog
        open={analysisOpen}
        onClose={handleAnalysisClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Analysis</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {call.evaluation && call.evaluation.analysis}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnalysisClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Accordion>
  );
};

export default CallItem;
