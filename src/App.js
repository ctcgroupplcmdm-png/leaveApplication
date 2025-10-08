import React, { useEffect, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import UserInfo from "./UserInfo";
import LandingPage from "./LandingPage";
import PersonalInfo from "./PersonalInfo";
import { Box, Button } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const { instance, accounts } = useMsal();
  const idleTimer = useRef(null);
  const IDLE_TIMEOUT = 10 * 60 * 1000; // ⏱ 10 minutes

  const login = () => instance.loginRedirect(loginRequest);

  // ✅ Make logout stable using useCallback
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

    resetTimer(); // initialize timer on mount

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [accounts, logout, IDLE_TIMEOUT]); // ✅ all dependencies stable

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
          // 🔒 Login screen
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
