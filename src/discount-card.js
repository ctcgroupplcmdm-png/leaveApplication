import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Box, Typography, Button, Grid, Paper } from "@mui/material";
import argosyLogo from "./assets/logos/argosy.png";
import ctcLogo from "./assets/logos/ctc.png";
import artviewLogo from "./assets/logos/artview.png";
import CassandraLogo from "./assets/logos/cassandra.png";
import autoLogo from "./assets/logos/automotive.png";
import wwlLogo from "./assets/logos/wwl.png";
import apexlLogo from "./assets/logos/apex.png";
import nkslLogo from "./assets/logos/nks.png";
import limnilLogo from "./assets/logos/limni.png";

const companyLogos = {
  "Argosy Trading Company Ltd": argosyLogo,
  "Cyprus Trading Corporation Plc": ctcLogo,
  "Artview Co. Ltd": artviewLogo,
  "CTC Automotive LTD": autoLogo,
  "Cassandra Trading Ltd": CassandraLogo,
  "Woolworth (Cyprus) Properties Plc": wwlLogo,
  "Apex Ltd": apexlLogo,
  "N.K. Shacolas (Holdings) Ltd": nkslLogo,
  "Cyprus Limni Resorts & Golf Courses Plc": limnilLogo,
};

function DiscountCard() {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [user, setUser] = useState(null);
  const [now] = useState(new Date());


  const logout = () => instance.logoutRedirect();

  // 🔹 Load stored user info (same pattern you already use)
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("userData"));
    if (stored) setUser(stored);
  }, []);



  if (!user) return null;

  // Split name
  const parts = user.name?.split(" ") || [];
  const first = parts[0] || "";
  const middle = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  return (
  <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
    {/* 🔹 Header (same style as PersonalInfo) */}
    <Grid
      container
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Grid item>
        <Button variant="outlined" onClick={() => navigate("/")}>
          ← Back
        </Button>
      </Grid>

      <Grid item>
        <Button variant="outlined" color="error" onClick={logout}>
          Logout
        </Button>
      </Grid>
    </Grid>

    {/* 🔹 Card */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 10,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: 360,
          height: 520,
          p: 4,
          borderRadius: 4,
          position: "relative",
          textAlign: "center",
          background: "linear-gradient(to bottom, #B9DCFF 0%, #ffffff 60%)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* 🔹 Decorative diagonal lines / light rays overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)",
            borderRadius: 4,
            pointerEvents: "none", // clicks pass through
          }}
        />

        {/* Discount Card Title */}
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            mb: 6,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#000000",
            textShadow: "1px 1px 3px rgba(0,0,0,0.3)", // subtle glow
          }}
        >
          DISCOUNT CARD
        </Typography>

        {/* Logo */}
        {companyLogos[user.companyName] && (
          <img
            src={companyLogos[user.companyName]}
            alt="logo"
            style={{
              position: "absolute",
              bottom: "25%",
              left: 16,
              right: 16,
              maxWidth: "calc(100% - 32px)",
              maxHeight: 180,
              objectFit: "contain",
              
              
              transform: "translateY(50%)",
            }}
          />
        )}

        {/* Names */}
        <Typography variant="h5" fontWeight="bold">
          {first}
        </Typography>

        {middle && (
          <Typography variant="h6" color="text.secondary">
            {middle}
          </Typography>
        )}

        <Typography variant="h5" fontWeight="bold">
          {last}
        </Typography>

        {/* Employee Code */}
        <Typography
          variant="subtitle1"
          sx={{ mt: 4, fontWeight: 600, letterSpacing: 1 }}
        >
          Employee Code: {user.employeeId}
        </Typography>

        {/* Timestamp bottom-center */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            color: "gray",
          }}
        >
          {now.toLocaleString()}
        </Typography>
      </Paper>
    </Box>
  </Box>
);

}

export default DiscountCard;
