// src/Components/PromptEditor.js

import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReactMarkdown from 'react-markdown';
import './PromptEditor.css';

const PromptEditor = ({ label, value, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <Box className="prompt-editor-container" sx={{ marginTop: '16px' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">{label}</Typography>
        <IconButton onClick={handleToggleExpand}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      {expanded ? (
        <Box display="flex" className="prompt-editor-expanded">
          <TextField
            label="Edit Prompt"
            multiline
            minRows={10}
            maxRows={Infinity}
            variant="outlined"
            value={value}
            onChange={handleChange}
            fullWidth
            sx={{ marginRight: '16px' }}
          />
          <Box className="markdown-preview" sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Preview</Typography>
            <Box className="markdown-content">
              <ReactMarkdown>{value}</ReactMarkdown>
            </Box>
          </Box>
        </Box>
      ) : (
        <TextField
          label={label}
          multiline
          rows={4}
          variant="outlined"
          value={value}
          onChange={handleChange}
          fullWidth
          sx={{ marginTop: '8px' }}
        />
      )}
    </Box>
  );
};

export default PromptEditor;
