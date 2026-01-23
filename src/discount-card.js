import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Box, Typography, Button, Grid, Paper } from "@mui/material";

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
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());

  const logout = () => instance.logoutRedirect();

  // 🔹 Load stored user info (same pattern you already use)
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("userData"));
    if (stored) setUser(stored);
  }, []);

  // 🔹 Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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
          elevation={6}
          sx={{
            width: 360,
            height: 520,
            p: 4,
            borderRadius: 4,
            position: "relative",
            textAlign: "center",
            background: "#ffffff",
          }}
        >
  {/* Discount Card Title */}
  <Typography
    variant="h6"
    fontWeight="bold"
    sx={{
      position: "absolute",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      letterSpacing: 2,
    }}
  >
    DISCOUNT CARD
  </Typography>

  {/* Logo */}
  {companyLogos[user.companyName] && (

            <img
              src={companyLogos[user.companyName]}
              alt="logo"
              style={{ width: 100, marginBottom: 30 }}
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

          {/* Timestamp bottom-left */}
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
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
