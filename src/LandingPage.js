import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// ✅ Map company names to logo filenames
const companyLogos = {
  "Argosy Trading Company Ltd": "argosy.png",
  "Cyprus Trading Corporation Plc": "ctc.png",
  "Artview Co. Ltd": "artview.png",
  "CTC Automotive Ltd": "automotive.png",
  "Cassandra Trading Ltd": "cassandra.png",
  "Woolworth (Cyprus) Properties Plc": "wwl.png",
  "Apex Ltd": "apex.png",
  "N.K. Shacolas (Holdings) Ltd": "nks.png",
  "Cyprus Limni Resorts & Golf Courses Plc": "limni.png",
};

function LandingPage() {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

      // Fetch basic info from Logic App (or Graph API)
      fetch(
        "https://prod-126.westeurope.logic.azure.com:443/workflows/c3bf058acb924c11925e5c660e1c3b5a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=tWDPd-5b4hzpzvJJjelfZCARBviG3gIJdTLHnXttUFg",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oid }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setUserData({
            name: data.displayName,
            employeeId: data.employeeId,
            phone: data.mobilePhone,
            companyName: data.companyName || "Company",
          });
        })
        .catch((err) => console.error("Error fetching user data:", err))
        .finally(() => setLoading(false));
    }
  }, [accounts]);

  const logout = () => instance.logoutRedirect();

  if (loading || !userData)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Bar */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        {/* Logo + Company Name */}
        <Grid item sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {userData?.companyName && companyLogos[userData.companyName] && (
            <img
              src={require(`./assets/logos/${companyLogos[userData.companyName]}`)}
              alt={userData.companyName}
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
          )}
          <Typography variant="h6" fontWeight="bold">
            {userData.companyName}
          </Typography>
        </Grid>

        {/* Logout Button */}
        <Grid item>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* Welcome Section */}
      <Box textAlign="center" sx={{ mt: 10 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome, {userData.name}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Employee ID: {userData.employeeId}
        </Typography>
        <Chip
          label={userData.companyName}
          color="primary"
          sx={{ fontSize: "1rem", mt: 1 }}
        />
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          mt: 8,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{
            px: 5,
            py: 2,
            textTransform: "none",
            fontSize: "1.1rem",
            borderRadius: "12px",
          }}
          onClick={() => navigate("/annual-leave")}
        >
          🗓 Annual Leave Portal
        </Button>

        <Button
          variant="contained"
          color="success"
          size="large"
          sx={{
            px: 5,
            py: 2,
            textTransform: "none",
            fontSize: "1.1rem",
            borderRadius: "12px",
          }}
          onClick={() => navigate("/personal-info")}
        >
          👤 Personal Information
        </Button>
      </Box>
    </Box>
  );
}

export default LandingPage;
