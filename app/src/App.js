// src/App.js

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FunctionListPage from "./Components/FunctionListPage";
import FunctionCreationPage from "./Components/FunctionCreationPage";
import FunctionVersionPage from "./Components/FunctionVersionPage";
import LoginPage from "./Components/LoginPage";
import AppErrorBoundary from "./Components/ErrorBoundary";
import AuthProvider from "./Contexts/AuthContext";
import PrivateRoute from "./Components/PrivateRoute";
import UpgradeEnterprisePage from './Components/UpgradeEnterprisePage';

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
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <FunctionListPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function-creation"
                  element={
                    <PrivateRoute>
                      <FunctionCreationPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/function/:functionId"
                  element={
                    <PrivateRoute>
                      <FunctionVersionPage />
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
              </Routes>
            </Router>
          </AppErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
