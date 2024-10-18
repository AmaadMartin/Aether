// src/Components/UpgradeEnterprisePage.js

import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Snackbar,
  Alert,
} from '@mui/material';
import api from '../Services/api';
import { AuthContext } from '../Contexts/AuthContext';

const UpgradeEnterprisePage = () => {
  const { userEmail } = useContext(AuthContext);
  const [email, setEmail] = useState(userEmail || '');
  const [message, setMessage] = useState(
    `Hi team at The Aether,

I’m looking to discuss The Aether’s custom pricing for my organization.

Many thanks!`
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/upgrade-enterprise', { email, message });
      setSnackbarMsg('Enterprise upgrade request submitted successfully!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      // Optionally, redirect or clear form
    } catch (error) {
      console.error(error);
      setSnackbarMsg('Failed to submit upgrade request.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>
          Upgrade to Enterprise
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Message"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            multiline
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Box mt={2}>
            <Button type="submit" variant="contained" color="primary">
              Submit Request
            </Button>
          </Box>
        </form>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMsg}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default UpgradeEnterprisePage;
