import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// ✅ Company Logos
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

function PersonalInfo() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    phone: "",
    personalEmail: "",
    maritalStatus: "",
    educationLevel: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const url =
    "https://prod-19.westeurope.logic.azure.com:443/workflows/0382cabb1f7d4771bc9b137b31cdd987/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=5xbVtCTV5KeN_mp5q8ORiLCzLumKfMAlkWhryTHKjho";

  const fetchUserInfo = (oid) => {
    setLoading(true);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, update: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        setFormData({
          fullName: data.FullName || "",
          employeeId: data.EmployeeId?.toString() || "",
          phone: data.Phone?.toString() || "",
          personalEmail: data.PersonalEmail || "",
          maritalStatus: data["Marital Status"] || "",
          educationLevel: data.EducationalLevel || "",
          gender: data.Gender || "",
        });
      })
      .catch((err) => console.error("Error fetching info:", err))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setChanged(true);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!changed) return;
    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

    setLoading(true);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oid,
        update: true,
        ...formData,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setSnackbar({
          open: true,
          message: "Information updated successfully.",
          severity: "success",
        });
        setChanged(false);
      })
      .catch(() =>
        setSnackbar({
          open: true,
          message: "Failed to update information.",
          severity: "error",
        })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
      fetchUserInfo(oid);
    }
  }, [accounts]);

  if (!userData)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 20 }}>
        <CircularProgress />
      </Box>
    );

  const logout = () => instance.logoutRedirect();

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
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
            {userData.companyName || "Company"}
          </Typography>
        </Grid>

        <Grid item sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate("/")}>
            ← Back
          </Button>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Personal Information
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {formData.employeeId}
      </Typography>

      {/* Form */}
      <Paper
        elevation={2}
        sx={{
          mt: 4,
          p: 4,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          maxWidth: "100%",
        }}
      >
        <Grid container spacing={3}>
          {/* Full Name */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              InputProps={{
                readOnly: true,
                style: { backgroundColor: "#f5f5f5", userSelect: "none" },
              }}
            />
          </Grid>

          {/* Employee ID */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={formData.employeeId}
              InputProps={{
                readOnly: true,
                style: { backgroundColor: "#f5f5f5", userSelect: "none" },
              }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              InputProps={{
                readOnly: true,
                style: { backgroundColor: "#f5f5f5", userSelect: "none" },
              }}
            />
          </Grid>

          {/* Personal Email */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Personal Email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleChange}
            />
          </Grid>

          {/* Marital Status */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Marital Status"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
            >
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Not married">Not married</MenuItem>
              <MenuItem value="Widow/Widower">Widow/Widower</MenuItem>
              <MenuItem value="Divorced">Divorced</MenuItem>
            </TextField>
          </Grid>

          {/* Gender */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {/* Education Level */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              fullWidth
              label="Education Level"
              name="educationLevel"
              value={formData.educationLevel || ""}
              onChange={handleChange}
            >
              <MenuItem value="High School">High School</MenuItem>
              <MenuItem value="Diploma">Diploma</MenuItem>
              <MenuItem value="Bachelors Degree">Bachelors Degree</MenuItem>
              <MenuItem value="Masters Degree">Masters Degree</MenuItem>
              <MenuItem value="Doctoral Degree">Doctoral Degree</MenuItem>
            </TextField>
          </Grid>

          {/* Update Button */}
          <Grid item xs={12} textAlign="right">
            <Button
              variant="contained"
              color="success"
              disabled={!changed || loading}
              onClick={handleUpdate}
            >
              {loading ? <CircularProgress size={24} /> : "Update Information"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PersonalInfo;
