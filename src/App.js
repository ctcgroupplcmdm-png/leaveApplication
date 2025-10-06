import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import UserInfo from "./UserInfo";
import { Box, Button } from "@mui/material";

function App() {
  const { instance, accounts } = useMsal();

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect();

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {accounts.length > 0 ? (
        <>
          <UserInfo onLogout={logout} />
        </>
      ) : (
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
  );
}

export default App;
