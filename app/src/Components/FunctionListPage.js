// src/Components/FunctionListPage.js

import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../Contexts/AuthContext';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../Services/api';
import './FunctionListPage.css';

const FunctionListPage = () => {
  const navigate = useNavigate();
  const [functions, setFunctions] = useState([]);
  const userName = localStorage.getItem('email');
  const { userEmail, apiKey } = useContext(AuthContext);

  const handleCopyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey)
      .then(() => {
        // alert('API key copied to clipboard');
      })
      .catch((err) => {
        console.error('Could not copy API key: ', err);
      });
  };

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      const response = await api.get(`/users/${userName}`);
      setFunctions(response.data.functions || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateNewFunction = () => {
    navigate('/function-creation');
  };

  const handleFunctionClick = (functionId) => {
    navigate(`/function/${functionId}`);
  };

  const handleCopyFunctionKey = (functionKey) => {
    navigator.clipboard.writeText(functionKey)
      .then(() => {
        // alert('Function key copied to clipboard');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };

  return (
    <Box className="function-list-container">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>
          Your Functions
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="body1" style={{ marginRight: '8px' }}>
            API Key: {apiKey}
          </Typography>
          <Tooltip title="Copy API Key">
            <IconButton
              edge="end"
              aria-label="copy"
              onClick={() => handleCopyApiKey(apiKey)}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateNewFunction}
        className="create-function-button"
      >
        Create New Function
      </Button>
      <List className="function-list">
        {functions.map((func, index) => (
          <React.Fragment key={func.name}>
            <ListItem
              className="function-list-item"
            >
              <ListItemText
                primary={func.name}
                secondary={func.task}
                onClick={() => handleFunctionClick(index)}
                style={{ cursor: 'pointer' }}
              />
              <Typography variant="body2" style={{ marginRight: '8px' }}>
                {func.function_key}
              </Typography>
              <Tooltip title="Copy Function Key">
                <IconButton
                  edge="end"
                  aria-label="copy"
                  onClick={() => handleCopyFunctionKey(func.function_key)}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default FunctionListPage;

