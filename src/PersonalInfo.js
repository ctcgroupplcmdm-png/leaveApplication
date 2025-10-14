import { useEffect, useState, useRef } from "react";
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
  InputAdornment,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

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

const NATIONALITY_OPTIONS = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin",
  "Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba",
  "Cyprus","Czech Republic","Denmark","Dominican Republic","Ecuador","Egypt","Estonia","Finland",
  "France","Georgia","Germany","Greece","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia",
  "Lebanon","Lithuania","Luxembourg","Malaysia","Malta","Mexico","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway",
  "Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden",
  "Switzerland","Thailand","Turkey","Ukraine","United Kingdom","United States of America","Uruguay",
  "Uzbekistan","Venezuela","Vietnam","Zambia","Zimbabwe"
];

const withCurrentOption = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

function PersonalInfo() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const originalData = useRef(null);

  const [userData, setUserData] = useState(null);
  const [userNeedsUpdate, setUserNeedsUpdate] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    phone: "",
    personalEmail: "",
    maritalStatus: "",
    educationalLevel: "",
    gender: "",
    companyName: "Company",
    nationalId: "",
    nationalIdExpiration: "",
    nationality: "",
    postalCode: "",
    streetAddress: "",
    streetNumber: "",
    apartment: "",
    area: "",
    city: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [errorFields, setErrorFields] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [addressLoading, setAddressLoading] = useState(false);
  const [streetOptions, setStreetOptions] = useState([]);
  const [addressMap, setAddressMap] = useState([]);

  const urlUserInfo =
    "https://prod-19.westeurope.logic.azure.com:443/workflows/0382cabb1f7d4771bc9b137b31cdd987/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=5xbVtCTV5KeN_mp5q8ORiLCzLumKfMAlkWhryTHKjho";
  const urlAddressLookup =
    "https://prod-24.westeurope.logic.azure.com:443/workflows/f0e93ec5ec1343a6bd52326577282aca/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=0c8NQEn0LBb8i5jEBUgpns8y8hSFZqOsG19f_Ktwzkw";
  const urlUserStatus =
    "https://prod-165.westeurope.logic.azure.com:443/workflows/c484da6f94ad4cd5aea8a92377375728/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=Bt8eh3QsyGHRYRmzqf2S0ujsaGxgxyVqUyCpYQmiIMY";

  // --- Fetch user info
  const fetchUserInfo = (oid) => {
    setLoading(true);
    fetch(urlUserInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, update: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        const normalized = {
          fullName: data.FullName || "",
          employeeId: data.EmployeeId?.toString() || "",
          phone: data.Phone?.toString() || "",
          personalEmail: data.PersonalEmail || "",
          maritalStatus: data["Marital Status"] || "",
          educationalLevel: data.EducationalLevel || "",
          gender: data.Gender || "",
          companyName: data.companyName || "Company",
          nationalId: data["National ID Number"] || "",
          nationalIdExpiration: data["National ID Expiration Date"] || "",
          nationality: data.Nationality || "",
          postalCode: data["Postal Code"]?.toString() || "",
          streetAddress: data["Street Address"] || "",
          streetNumber: data["Street Number"]?.toString() || "",
          apartment: data["Apartment "] || "",
          area: data.Area || "",
          city: data.City || "",
          emergencyContactName: data["Emergency Contact Name"] || "",
          emergencyContactNumber: data["Emergency Contact Number"] || "",
        };
        setUserData({ companyName: normalized.companyName });
        setFormData(normalized);
        originalData.current = normalized;
        setChanged(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // --- Check user status
  const fetchUserStatus = (oid, employeeId) => {
    fetch(urlUserStatus, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, employeeId }),
    })
      .then((res) => res.json())
      .then((data) => setUserNeedsUpdate(data.status === true))
      .catch(console.error);
  };

  // --- Postal code address lookup
  const fetchAddressesByPostalCode = async (postalCode) => {
    if (postalCode.length < 4) return;
    setAddressLoading(true);
    try {
      const res = await fetch(urlAddressLookup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode }),
      });
      const data = await res.json();
      if (Array.isArray(data.addresses)) {
        setAddressMap(data.addresses);
        setStreetOptions(data.addresses.map((a) => a.Street));
      }
    } catch {
      setStreetOptions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (formData.postalCode?.length === 4) fetchAddressesByPostalCode(formData.postalCode);
  }, [formData.postalCode]);

  // --- Handle changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    if (name === "streetAddress") {
      const selected = addressMap.find((a) => a.Street === value);
      if (selected) updated = { ...updated, area: selected.Area, city: selected.City };
    }
    setFormData(updated);
    setChanged(
      Object.keys(updated).some(
        (k) => k !== "companyName" && (originalData.current?.[k] ?? "") !== (updated[k] ?? "")
      )
    );
  };

  // --- Submit update
  const handleUpdate = () => {
    if (!changed && !userNeedsUpdate) return;

    const required = [
      "fullName","employeeId","phone","personalEmail","maritalStatus","educationalLevel","gender",
      "nationalId","nationality","postalCode","streetAddress","streetNumber","area","city",
      "apartment","emergencyContactName","emergencyContactNumber"
    ];
    const missing = required.filter((f) => !formData[f]?.trim());
    if (missing.length) {
      setErrorFields(missing);
      setSnackbar({ open: true, message: "Please fill all required fields.", severity: "error" });
      return;
    }

    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

    setLoading(true);
    fetch(urlUserInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, update: true, ...formData }),
    })
      .then((res) => res.json())
      .then(() => {
        setSnackbar({ open: true, message: "Information updated successfully.", severity: "success" });
        setChanged(false);
        setUserNeedsUpdate(false);
      })
      .catch(() =>
        setSnackbar({ open: true, message: "Failed to update information.", severity: "error" })
      )
      .finally(() => setLoading(false));
  };

  // --- On mount
 // --- Fetch user info once after login
useEffect(() => {
  if (accounts.length > 0) {
    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
    fetchUserInfo(oid);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [accounts]);

// --- Fetch user status AFTER user info has loaded (employeeId present)
useEffect(() => {
  if (accounts.length > 0 && formData.employeeId) {
    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
    fetchUserStatus(oid, formData.employeeId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [formData.employeeId]);


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
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {companyLogos[userData.companyName] && (
            <img src={companyLogos[userData.companyName]} alt={userData.companyName} width={60} />
          )}
          <Typography variant="h6" fontWeight="bold">
            {userData.companyName}
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

      <Typography variant="subtitle1" color="text.secondary">
        Employee ID: {formData.employeeId}
      </Typography>

      {/* Warning */}
      {userNeedsUpdate && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          ⚠️ Your information has not been updated for over 2 years. Please review and update below.
        </Alert>
      )}

      {/* Main form */}
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        {/* --- Personal Info --- */}
        <Typography variant="h6" sx={{ mb: 2 }}>📋 Personal Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Employee ID" value={formData.employeeId} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Phone" value={formData.phone} disabled />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth label="Personal Email" name="personalEmail" value={formData.personalEmail}
              onChange={handleChange} error={errorFields.includes("personalEmail")}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select fullWidth label="Marital Status" name="maritalStatus"
              value={formData.maritalStatus} onChange={handleChange}
            >
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Not married">Not married</MenuItem>
              <MenuItem value="Widow/Widower">Widow/Widower</MenuItem>
              <MenuItem value="Divorced">Divorced</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select fullWidth label="Educational Level" name="educationalLevel"
              value={formData.educationalLevel} onChange={handleChange}
            >
              <MenuItem value="High School">High School</MenuItem>
              <MenuItem value="Diploma">Diploma</MenuItem>
              <MenuItem value="Bachelor's Degree">Bachelor's Degree</MenuItem>
              <MenuItem value="Master's Degree">Master's Degree</MenuItem>
              <MenuItem value="Doctoral Degree">Doctoral Degree</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* --- Identification --- */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>🪪 Identification Details</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="National ID Number" name="nationalId"
              value={formData.nationalId} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="date" label="National ID Expiration Date" name="nationalIdExpiration"
              value={formData.nationalIdExpiration || ""} onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Nationality" name="nationality"
              value={formData.nationality || ""} onChange={handleChange}>
              {withCurrentOption(NATIONALITY_OPTIONS, formData.nationality).map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* --- Address --- */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>🏠 Residential Address</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={2.4}>
            <TextField fullWidth label="Postal Code" name="postalCode" value={formData.postalCode}
              onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField
              select fullWidth label="Street Address" name="streetAddress"
              value={formData.streetAddress || ""} onChange={handleChange}
              InputProps={{
                endAdornment: addressLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null,
              }}
            >
              {withCurrentOption(streetOptions, formData.streetAddress).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField fullWidth label="Street Number" name="streetNumber"
              value={formData.streetNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField fullWidth label="Area" value={formData.area} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <TextField fullWidth label="City" value={formData.city} InputProps={{ readOnly: true }} />
          </Grid>
        </Grid>

        {/* --- Emergency --- */}
        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>☎️ Emergency Contact</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Emergency Contact Name" name="emergencyContactName"
              value={formData.emergencyContactName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Emergency Contact Number" name="emergencyContactNumber"
              value={formData.emergencyContactNumber} onChange={handleChange} />
          </Grid>
        </Grid>

        {/* --- Update Button --- */}
        <Grid container mt={4}>
          <Grid item xs={12} textAlign="right">
            <Button
  variant={userNeedsUpdate ? "outlined" : "contained"}
  color={userNeedsUpdate ? "warning" : "success"}
  disabled={loading} // ✅ allow update if outdated, regardless of changes
  onClick={handleUpdate}

              sx={{
                fontWeight: "bold",
                px: 4,
                py: 1.2,
                ...(userNeedsUpdate && {
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(255,165,0, 0.4)" },
                    "70%": { boxShadow: "0 0 0 10px rgba(255,165,0, 0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(255,165,0, 0)" },
                  },
                }),
              }}
            >
              {loading ? <CircularProgress size={24} /> : userNeedsUpdate ? "⚠️ Needs Update — Click to Confirm" : "Update Information"}
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
