import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
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
  const [userStatus, setUserStatus] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logic App URLs
  const urlUserInfo =
    "https://prod-126.westeurope.logic.azure.com:443/workflows/c3bf058acb924c11925e5c660e1c3b5a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=tWDPd-5b4hzpzvJJjelfZCARBviG3gIJdTLHnXttUFg";
  const urlUserStatus =
    "https://prod-165.westeurope.logic.azure.com:443/workflows/c484da6f94ad4cd5aea8a92377375728/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=Bt8eh3QsyGHRYRmzqf2S0ujsaGxgxyVqUyCpYQmiIMY";

  useEffect(() => {
  const fetchData = async () => {
    if (accounts.length === 0) return;

    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

    try {
      const infoRes = await fetch(urlUserInfo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oid }),
      });
      const infoData = await infoRes.json();

      const employeeId = infoData.employeeId;

      setUserData({
        name: infoData.displayName,
        employeeId: employeeId,
        phone: infoData.mobilePhone,
        companyName: infoData.companyName || "Company",
      });

      // 🟩 Fetch user status
      const statusRes = await fetch(urlUserStatus, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oid, employeeId }),
      });
      const statusData = await statusRes.json();

      const status =
        statusData.status === true
          ? "NeedsUpdate"
          : statusData.status === false
          ? "UpToDate"
          : "Unknown";

      setUserStatus(status);

      // 🧠 Save it so PersonalInfo can read it
      localStorage.setItem("needsUpdate", status === "NeedsUpdate" ? "true" : "false");
    } catch (err) {
      console.error("Error fetching user data or status:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
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
      {/* 🔹 Header Bar */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
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

        <Grid item>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* 🔹 Welcome Message */}
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

      {/* 🔹 Buttons + Warning Banner */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 8,
          gap: 3,
        }}
      >
        {/* Buttons Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
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

          {/* ✅ Keep Personal Information Button */}
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

        {/* ⚠️ Warning Banner (kept as is) */}
        {userStatus === "NeedsUpdate" && (
          <Alert
            severity="warning"
            sx={{
              mt: 3,
              maxWidth: "600px",
              textAlign: "center",
              borderRadius: "12px",
              fontSize: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            Our records show you haven’t updated your personal information in
            over 2 years.
            <Button
              variant="contained"
              color="warning"
              size="small"
              sx={{
                mt: 2,
                textTransform: "none",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
              onClick={() =>
                navigate("/personal-info", { state: { forceUpdate: true } })
              }
            >
              Update Now
            </Button>
          </Alert>
        )}
      </Box>
    </Box>
  );
}

export default LandingPage;
