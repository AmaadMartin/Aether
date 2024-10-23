// src/App.js

import React, { useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FunctionListPage from "./Components/FunctionListPage";
import FunctionCreationPage from "./Components/FunctionCreationPage";
import FunctionVersionPage from "./Components/FunctionVersionPage";
import LandingPage from "./Components/LandingPage";
import AppErrorBoundary from "./Components/ErrorBoundary";
import AuthProvider, { AuthContext } from "./Contexts/AuthContext";
import PrivateRoute from "./Components/PrivateRoute";
import UpgradeEnterprisePage from './Components/UpgradeEnterprisePage';
import Navbar from './Components/Navbar';
import Docs from './Pages/Docs'

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
              <Navbar />
              <Routes>
                <Route path="/" element={<LandingWrapper />} />
                <Route path="/login" element={<LandingWrapper />} />

                {/* Protected Routes */}
                <Route
                  path="/functions"
                  element={
                    <PrivateRoute>
                      <FunctionListPage isFlow={false} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function-creation"
                  element={
                    <PrivateRoute>
                      <FunctionCreationPage isFlow={false} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function/:functionId"
                  element={
                    <PrivateRoute>
                      <FunctionVersionPage isFlow={false} />
                    </PrivateRoute>
                  }
                />

                {/* Routes for Flows */}
                <Route
                  path="/flows"
                  element={
                    <PrivateRoute>
                      <FunctionListPage isFlow={true} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/flow-creation"
                  element={
                    <PrivateRoute>
                      <FunctionCreationPage isFlow={true} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/flow/:functionId"
                  element={
                    <PrivateRoute>
                      <FunctionVersionPage isFlow={true} />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/upgrade-enterprise"
                  element={
                    <PrivateRoute>
                      <UpgradeEnterprisePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/docs"
                  element={
                    <PrivateRoute>
                      <Docs />
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

const LandingWrapper = () => {
  const { userEmail, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return userEmail ? <Navigate to="/functions" /> : <LandingPage />;
};

export default App;
