// src/Components/LandingPage.js

import React from 'react';
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../Services/api';
import { AuthContext } from '../Contexts/AuthContext';
import { useContext } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setUserEmail, setApiKey } = useContext(AuthContext);

  const handleLoginSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;

    try {
      // Send the ID token to the backend
      const response = await api.post('/auth/login', {
        token: credential,
      });
      console.log('Login successful', response);
      const email = response.data.email;
      const apiKey = response.data.api_key;
      console.log('Email', email);
      console.log('API Key', apiKey);

      // Store the user data and token in localStorage or context
      localStorage.setItem('token', credential);
      localStorage.setItem('email', email);
      localStorage.setItem('api_key', apiKey);

      setUserEmail(email);
      setApiKey(apiKey);

      // Navigate to the main app
      navigate('/functions'); // Ensure this path matches your routing
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
  };

  return (
    <Box sx={{ backgroundColor: '#eff8ff', minHeight: '100vh', py: 8 }}>
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      {/* Title Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src="/The_Aether_Black.png" alt="Aether Logo" style={{ width: 'auto', height: 'auto', marginLeft: '55px' }} />
            </Box>
        </Box>
      {/* Main Content Grid */}
      <Grid container spacing={4} justifyContent="center" alignItems="center">
        {/* Centered Content */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Your IDE for <strong>Prompt Engineering</strong>
            </Typography>
            {/* Optional Subtitle */}
            {/* <Typography variant="h6" component="h3" gutterBottom>
              Making Prompt Engineering <strong>Fast</strong>
            </Typography> */}
          </Box>
        </Grid>

        {/* Google Login Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              size="large"
            />
          </Box>
        </Grid>

        {/* GitHub Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GitHubIcon />}
              href="https://github.com/AmaadMartin/Aether-Library"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Library on GitHub
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* How It Works Section */}
      <Box sx={{ mt: 12 }}>
        <Typography variant="h4" component="h3" gutterBottom align="center">
          How It Works
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4,
            // Make the iframe responsive
            position: 'relative',
            paddingTop: '56.25%', // 16:9 Aspect Ratio
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/SZ8R1COi1vM?si=cxW3JQ52cieA-Fri"
            title="How Aether Works"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          ></iframe>
        </Box>
      </Box>
    </Container>
    </Box>
  );
};

export default LandingPage;
