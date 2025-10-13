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
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mexico", "Moldova", "Monaco", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Syria", "Taiwan", "Tanzania",
  "Thailand", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay",
  "Uzbekistan", "Vatican City", "Venezuela", "Vietnam", "Zambia", "Zimbabwe",
];

const withCurrentOption = (options, current) => {
  if (!current) return options;
  return options.includes(current) ? options : [current, ...options];
};

function PersonalInfo() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const originalData = useRef(null);
  const [userData, setUserData] = useState(null);
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

  // Fetch user info
  const fetchUserInfo = (oid) => {
    setLoading(true);
    fetch(urlUserInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, update: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        let ecName = data["Emergency Contact Name"] ?? "";
        let ecNumber = data["Emergency Contact Number"] ?? "";
        const ecNameStr = String(ecName ?? "");
        if (!ecNumber && /^\d{5,}$/.test(ecNameStr)) {
          ecNumber = ecNameStr;
          ecName = "";
        }
        const normalized = {
          fullName: data.FullName || "",
          employeeId: data.EmployeeId?.toString() || "",
          phone: data.Phone?.toString() || "",
          personalEmail: data.PersonalEmail || data["Personal Email"] || "",
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
          emergencyContactName: String(ecName || ""),
          emergencyContactNumber: String(ecNumber || ""),
        };
        setUserData({ companyName: normalized.companyName });
        setFormData(normalized);
        originalData.current = normalized;
        setChanged(false);
      })
      .catch((err) => console.error("Error fetching info:", err))
      .finally(() => setLoading(false));
  };

  // Address lookup
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
      if (data.addresses && Array.isArray(data.addresses)) {
        setAddressMap(data.addresses);
        setStreetOptions(data.addresses.map((a) => a.Street));
      } else {
        setAddressMap([]);
        setStreetOptions(["No addresses found"]);
      }
    } catch {
      setAddressMap([]);
      setStreetOptions(["Error retrieving addresses"]);
    } finally {
      setAddressLoading(false);
    }
  };

  // Watch postal code
  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 4) {
      fetchAddressesByPostalCode(formData.postalCode);
    }
  }, [formData.postalCode]);

  const hasChanges = (current, original) =>
    Object.keys(current).some((key) => key !== "companyName" && (original?.[key] ?? "") !== (current?.[key] ?? ""));

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    if (name === "streetAddress") {
      const selected = addressMap.find((a) => a.Street === value);
      if (selected) updated = { ...updated, area: selected.Area, city: selected.City };
    }
    setFormData(updated);
    setChanged(hasChanges(updated, originalData.current));
  };

  const handleUpdate = () => {
    if (!changed) return;
    const requiredFields = [
      "fullName", "employeeId", "phone", "personalEmail", "maritalStatus",
      "educationalLevel", "gender", "nationalId", "nationality", "postalCode",
      "streetAddress", "streetNumber", "area", "city", "apartment",
      "emergencyContactName", "emergencyContactNumber",
    ];
    const missing = requiredFields.filter((f) => !formData[f] || String(formData[f]).trim() === "");
    if (missing.length > 0) {
      setErrorFields(missing);
      setSnackbar({ open: true, message: "Please fill in all required fields before updating.", severity: "error" });
      return;
    }
    setErrorFields([]);
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
        originalData.current = formData;
        setChanged(false);
      })
      .catch(() => setSnackbar({ open: true, message: "Failed to update information.", severity: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (accounts.length > 0) {
      const oid = accounts[0]?.idTokenClaims?.oid || accounts[0]?.idTokenClaims?.sub;
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
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {userData?.companyName && companyLogos[userData.companyName] && (
            <img
              src={companyLogos[userData.companyName]}
              alt={userData.companyName}
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
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

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {formData.employeeId}
      </Typography>

      <Paper elevation={3} sx={{ mt: 4, p: 4, backgroundColor: "#fff", borderRadius: 2 }}>
        {/* 📋 Personal Information */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: "#f9fafb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            📋 Personal Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Employee ID" name="employeeId" value={formData.employeeId} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Phone" name="phone" value={formData.phone} disabled />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Personal Email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                error={errorFields.includes("personalEmail")}
                helperText={errorFields.includes("personalEmail") ? "Required" : ""}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Marital Status"
                name="maritalStatus"
                value={formData.maritalStatus || ""}
                onChange={handleChange}
                error={errorFields.includes("maritalStatus")}
                helperText={errorFields.includes("maritalStatus") ? "Required" : ""}
              >
                <MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Not married">Not married</MenuItem>
                <MenuItem value="Widow/Widower">Widow/Widower</MenuItem>
                <MenuItem value="Divorced">Divorced</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Educational Level"
                name="educationalLevel"
                value={formData.educationalLevel || ""}
                onChange={handleChange}
                error={errorFields.includes("educationalLevel")}
                helperText={errorFields.includes("educationalLevel") ? "Required" : ""}
              >
                <MenuItem value="High School">High School</MenuItem>
                <MenuItem value="Diploma">Diploma</MenuItem>
                <MenuItem value="Bachelor's Degree">Bachelor's Degree</MenuItem>
                <MenuItem value="Master's Degree">Master's Degree</MenuItem>
                <MenuItem value="Doctoral Degree">Doctoral Degree</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Gender"
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                error={errorFields.includes("gender")}
                helperText={errorFields.includes("gender") ? "Required" : ""}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Remaining sections (Identification, Address, Emergency Contact) unchanged */}
        {/* ... keep your existing code here ... */}
      </Paper>

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
