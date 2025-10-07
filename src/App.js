import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import UserInfo from "./UserInfo";
import LandingPage from "./LandingPage";
import PersonalInfo from "./PersonalInfo";
import { Box, Button } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const { instance, accounts } = useMsal();

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect();

  return (
    <Router>
      <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        {accounts.length > 0 ? (
          <Routes>
            {/* 🏠 Landing Page */}
            <Route path="/" element={<LandingPage onLogout={logout} />} />

            {/* 🗓 Annual Leave Page */}
            <Route path="/annual-leave" element={<UserInfo onLogout={logout} />} />

            {/* 👤 Personal Info Page */}
            <Route path="/personal-info" element={<PersonalInfo onLogout={logout} />} />
          </Routes>
        ) : (
          // 🔒 Login Screen
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
