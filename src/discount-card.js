import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Paper } from "@mui/material";

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

    // Freeze timestamp
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
        backgroundColor: "#e0e0e0",
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: 380,
          height: 220,
          borderRadius: 4,
          background: "linear-gradient(145deg, #ffffff, #f0f0f3)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo Background */}
        {userData.companyName && companyLogos[userData.companyName] && (
          <Box
            component="img"
            src={companyLogos[userData.companyName]}
            alt={userData.companyName}
            sx={{
              width: "100%",
              height: 80,
              objectFit: "cover",
            }}
          />
        )}

        {/* DISCOUNT CARD text */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            fontFamily: "'Arial Black', sans-serif",
            color: "#ff5722",
            textAlign: "center",
            mt: 1,
            textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          DISCOUNT CARD
        </Typography>

        {/* Employee info */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {userData.firstName} {userData.middleName} {userData.surname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Employee ID: {userData.employeeId}
          </Typography>
        </Box>

        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: "absolute", bottom: 12, left: 16 }}
        >
          Generated at: {timestamp}
        </Typography>

        {/* Buttons */}
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            right: 16,
            display: "flex",
            gap: 8,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            ← Back
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={logout}
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            Logout
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default DiscountCard;
