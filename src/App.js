import React, { useEffect, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import UserInfo from "./UserInfo";
import LandingPage from "./LandingPage";
import DiscountCard from "./DiscountCard";
import PersonalInfo from "./PersonalInfo";
import { Box, Button, Typography, Paper } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const { instance, accounts } = useMsal();
  const idleTimer = useRef(null);
  const IDLE_TIMEOUT = 10 * 60 * 1000; // ⏱ 10 minutes

  const login = () => instance.loginRedirect(loginRequest);

  const logout = useCallback(() => {
    instance.logoutRedirect();
  }, [instance]);

  // 🕒 Logout automatically after 10 minutes of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        if (accounts.length > 0) {
          console.log("⏰ Idle timeout reached — logging out");
          logout();
        }
      }, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [accounts, logout, IDLE_TIMEOUT]);

  return (
    <Router>
      <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        {accounts.length > 0 ? (
          <Routes>
            <Route path="/" element={<LandingPage onLogout={logout} />} />
            <Route path="/annual-leave" element={<UserInfo onLogout={logout} />} />
            <Route path="/personal-info" element={<PersonalInfo onLogout={logout} />} />
			<Route path="/discount-card" element={<DiscountCard onLogout={logout} />} />
          </Routes>
        ) : (
          // 🔒 Styled Login Screen
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              textAlign: "center",
            }}
          >
            <Paper
              elevation={4}
              sx={{
                p: 5,
                borderRadius: 3,
                textAlign: "center",
                maxWidth: 400,
                width: "90%",
                backgroundColor: "#ffffffdd",
              }}
            >
              <img
                src={require("./assets/logos/ctc.png")}
                alt="CTC Group"
                style={{ width: 120, height: "auto", marginBottom: 20 }}
              />

              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Welcome to CTC Group Portal
              </Typography>

              <Typography variant="body2" color="text.secondary" mb={4}>
                Access your employee dashboard, leave records, and personal information
                securely with your Microsoft account.
              </Typography>

              <Button
                onClick={login}
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontSize: "1rem",
                  px: 5,
                  py: 1.2,
                  fontWeight: "bold",
                  borderRadius: 2,
                }}
              >
                Login
              </Button>
            </Paper>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ position: "absolute", bottom: 20 }}
            >
              © {new Date().getFullYear()} Cyprus Trading Corporation Plc. All rights reserved.
            </Typography>
          </Box>
        )}
      </Box>
    </Router>
  );
}

export default App;
