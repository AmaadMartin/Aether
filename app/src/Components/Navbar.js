// src/Components/Navbar.js

import React, { useContext } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { AuthContext } from "../Contexts/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";

const Navbar = () => {
  const { userEmail, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to landing page after logout
  };

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "#eff8ff", color: "#000" }}
    >
      {userEmail && (
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between", // Pushes items to the far ends of the container
              alignItems: "center",
              width: "100%", // Makes sure the box takes the full width of the navbar
            }}
          >
            {/* Left side: Logo and Navigation Buttons */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <NavLink to="/flows">
                <img
                  src="/The_Aether_Black.png"
                  alt="Aether Logo"
                  style={{ height: "50px", cursor: "pointer" }}
                />
              </NavLink>
              <>
                <Button
                  color="inherit"
                  component={NavLink}
                  to="/flows"
                  sx={{ ml: 2 }}
                >
                  Flows
                </Button>
                <Button
                  color="inherit"
                  component={NavLink}
                  to="/functions"
                  sx={{ ml: 2 }}
                >
                  Functions
                </Button>
                <Button
                  color="inherit"
                  component={NavLink}
                  to="/docs"
                  sx={{ ml: 2 }}
                >
                  Docs
                </Button>
              </>
            </Box>

            {/* Right side: Logout Button */}
            <Button color="inherit" component={NavLink} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      )}
    </AppBar>
  );
};

export default Navbar;
