import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Paper } from "@mui/material";

// Import all company logos
import argosy from "./assets/logos/argosy.png";
import ctc from "./assets/logos/ctc.png";
import artview from "./assets/logos/artview.png";
import automotive from "./assets/logos/automotive.png";
import cassandra from "./assets/logos/cassandra.png";
import wwl from "./assets/logos/wwl.png";
import apex from "./assets/logos/apex.png";
import nks from "./assets/logos/nks.png";
import limni from "./assets/logos/limni.png";

const companyLogos = {
  "Argosy Trading Company Ltd": argosy,
  "Cyprus Trading Corporation Plc": ctc,
  "Artview Co. Ltd": artview,
  "CTC Automotive Ltd": automotive,
  "Cassandra Trading Ltd": cassandra,
  "Woolworth (Cyprus) Properties Plc": wwl,
  "Apex Ltd": apex,
  "N.K. Shacolas (Holdings) Ltd": nks,
  "Cyprus Limni Resorts & Golf Courses Plc": limni,
};

function DiscountCard() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [timestamp, setTimestamp] = useState("");

  // Freeze timestamp on first render
  useEffect(() => {
    if (accounts.length === 0) return;

    const account = accounts[0];
    const nameParts = account.name?.split(" ") || ["User"];
    const firstName = nameParts[0] || "";
    const middleName = nameParts.length === 3 ? nameParts[1] : "";
    const surname = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : "";

    setUserData({
      companyName: account.idTokenClaims?.company || "Company",
      firstName,
      middleName,
      surname,
      employeeId: account.idTokenClaims?.eid || "N/A",
    });

    // Freeze timestamp once
    const now = new Date();
    const formatted = now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTimestamp(formatted);
  }, [accounts]);

  const logout = () => instance.logoutRedirect();

  if (!userData) return null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: 360,
          borderRadius: 3,
          p: 3,
          background:
            "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
          position: "relative",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        {userData.companyName && companyLogos[userData.companyName] && (
          <Box
            component="img"
            src={companyLogos[userData.companyName]}
            alt={userData.companyName}
            sx={{
              width: "100%",
              height: 120,
              objectFit: "cover",
              borderRadius: "12px",
              mb: 2,
            }}
          />
        )}

        {/* Employee Info */}
        <Typography variant="h6" fontWeight="bold">
          {userData.firstName} {userData.middleName} {userData.surname}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={2}>
          Employee ID: {userData.employeeId}
        </Typography>

        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: "absolute", bottom: 16, left: 16 }}
        >
          Generated at: {timestamp}
        </Typography>

        {/* Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none" }}
          >
            ← Back
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={logout}
            sx={{ textTransform: "none" }}
          >
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default DiscountCard;
