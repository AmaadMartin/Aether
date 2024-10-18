import React, { useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FunctionListPage from "./Components/FunctionListPage";
import FunctionCreationPage from "./Components/FunctionCreationPage";
import FunctionVersionPage from "./Components/FunctionVersionPage";
import LandingPage from "./Components/LandingPage"; // Import LandingPage
import AppErrorBoundary from "./Components/ErrorBoundary";
import AuthProvider, { AuthContext } from "./Contexts/AuthContext";
import PrivateRoute from "./Components/PrivateRoute";
import UpgradeEnterprisePage from './Components/UpgradeEnterprisePage';
import Navbar from './Components/Navbar';

const theme = createTheme({
  // Customize your theme here if needed
});

function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  console.log("clientId", clientId);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppErrorBoundary>
            <Router>
              <Routes>
                {/* Landing Page Route */}
                <Route path="/" element={<LandingWrapper />} />

                {/* Login Route */}
                <Route path="/login" element={<LandingWrapper />} />

                {/* Protected Routes */}
                <Route
                  path="/functions"
                  element={
                    <PrivateRoute>
                      <Navbar /> {/* Add Navbar here */}
                      <FunctionListPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function-creation"
                  element={
                    <PrivateRoute>
                      <Navbar /> {/* Add Navbar here */}
                      <FunctionCreationPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function/:functionId"
                  element={
                    <PrivateRoute>
                      <Navbar /> {/* Add Navbar here */}
                      <FunctionVersionPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/upgrade-enterprise"
                  element={
                    <PrivateRoute>
                      <Navbar /> {/* Add Navbar here */}
                      <UpgradeEnterprisePage />
                    </PrivateRoute>
                  }
                />
                
                {/* Redirect any unknown routes to landing page */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </AppErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// Wrapper component to handle redirection based on authentication status
const LandingWrapper = () => {
  const { userEmail, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return userEmail ? <Navigate to="/functions" /> : <LandingPage />;
};

export default App;
