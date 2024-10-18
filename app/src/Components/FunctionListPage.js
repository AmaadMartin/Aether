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
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import api from '../Services/api';
import './FunctionListPage.css';
import TierUpgrade from './TierUpgrade';

const tierFeatures = {
  Hobby: [
    "Function creation",
    "Version deployment (No version tree)",
    "Commit changes to the same version",
    "Max 5 tests in test set",
  ],
  Pro: [
    "Everything in Hobby",
    "Version tree",
    "Logging and evaluation",
    "Max 50 tests in test set",
  ],
  Enterprise: [
    "Everything in Pro",
    "Automated test set generation",
    "No limit on test set",
    "Automatic prompt optimization",
  ],
};

const FunctionListPage = () => {
  const navigate = useNavigate();
  const [functions, setFunctions] = useState([]);
  const { userEmail, apiKey, tier, setTier, loading, error } = useContext(AuthContext);

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Snackbar state variables
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCopyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey)
      .then(() => {
        setSnackbar({ open: true, message: 'API Key copied to clipboard!', severity: 'success' });
      })
      .catch((err) => {
        console.error('Could not copy API key: ', err);
        setSnackbar({ open: true, message: 'Failed to copy API Key.', severity: 'error' });
      });
  };

  const handleCopyFunctionKey = (functionKey) => {
    navigator.clipboard.writeText(functionKey)
      .then(() => {
        setSnackbar({ open: true, message: 'Function Key copied to clipboard!', severity: 'success' });
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
        setSnackbar({ open: true, message: 'Failed to copy Function Key.', severity: 'error' });
      });
  };

  useEffect(() => {
    if (userEmail && apiKey) {
      fetchFunctions();
    }
  }, [userEmail, apiKey]);

  const fetchFunctions = async () => {
    try {
      const response = await api.get(`/users/${encodeURIComponent(userEmail)}`);
      setFunctions(response.data?.functions || []);
      setTier(response.data?.tier || 'Hobby'); // Update tier in context
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Failed to fetch functions.', severity: 'error' });
    }
  };

  const handleCreateNewFunction = () => {
    navigate('/function-creation');
  };

  const handleFunctionClick = (functionId) => {
    navigate(`/function/${functionId}`);
  };

  const handleUpgradeClick = () => {
    setUpgradeDialogOpen(true);
  };

  const handleUpgradeClose = () => {
    setUpgradeDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box className="function-list-container" position="relative" minHeight="100vh" paddingBottom="60px">
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>
          Your Functions
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="body1" style={{ marginRight: '8px' }}>
            Tier: {tier}
          </Typography>
          <Tooltip
            title={
              <Box>
                {tierFeatures[tier]?.map((feature, index) => (
                  <Typography key={index} variant="body2">
                    {feature}
                  </Typography>
                ))}
              </Box>
            }
            arrow
            placement="bottom"
          >
            <IconButton>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" color="secondary" onClick={handleUpgradeClick}>
            Upgrade
          </Button>
        </Box>
      </Box>

      {/* TierUpgrade Dialog */}
      <TierUpgrade open={upgradeDialogOpen} onClose={handleUpgradeClose} />

      {/* Create New Function Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateNewFunction}
        className="create-function-button"
        sx={{ mb: 2 }}
      >
        Create New Function
      </Button>

      {/* Function List */}
      <List className="function-list">
        {functions.map((func, index) => (
          <React.Fragment key={func.name}>
            <ListItem
              className="function-list-item"
              divider
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
          </React.Fragment>
        ))}
      </List>

      {/* API Key Section - Moved to Bottom Right */}
      <Box
        position="absolute"
        bottom="70px"
        right="20px"
        display="flex"
        alignItems="center"
      >
        <Typography variant="body1" mr={1}>
          Your API Key: {apiKey}
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

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FunctionListPage;
