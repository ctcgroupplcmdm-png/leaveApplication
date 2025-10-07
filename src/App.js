import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { Box, Button } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./LandingPage";
import UserInfo from "./UserInfo"; // Annual Leave page

function App() {
  const { instance, accounts } = useMsal();

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect();

  return (
    <Router>
      <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        {accounts.length > 0 ? (
          <Routes>
            {/* Landing page after login */}
            <Route path="/" element={<LandingPage />} />

            {/* Annual Leave page */}
            <Route path="/annual-leave" element={<UserInfo onLogout={logout} />} />

            {/* Placeholder for future page */}
            <Route
              path="/personal-info"
              element={
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                  }}
                >
                  <h2>Personal Information Page — Coming Soon</h2>
                  <Button
                    variant="outlined"
                    onClick={() => window.history.back()}
                    sx={{ mt: 2 }}
                  >
                    Go Back
                  </Button>
                </Box>
              }
            />
          </Routes>
        ) : (
          // Login Screen
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
            }}
          >
            <Button
              onClick={login}
              variant="contained"
              sx={{ textTransform: "none", fontSize: "1rem", px: 4, py: 1.5 }}
            >
              Login
            </Button>
          </Box>
        )}
      </Box>
    </Router>
  );
}

export default App;
