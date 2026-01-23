import { useLocation } from "react-router-dom";
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
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

const withCurrentOption = (options, current) => {
  if (!current) return options;
  return options.includes(current) ? options : [current, ...options];
};

function PersonalInfo() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();

  const [showWarning, setShowWarning] = useState(
  localStorage.getItem("needsUpdate") === "true"
);

const forceUpdate = location.state?.forceUpdate || false;
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

  // Update
  // Update
const handleUpdate = () => {
  // ✅ Allow update if there are changes OR if this is a forced/confirmation update
  if (!changed && !forceUpdate && !showWarning) return;

  const requiredFields = [
    "fullName", "employeeId", "phone", "personalEmail", "maritalStatus",
    "educationalLevel", "gender", "nationalId", "nationality", "postalCode",
    "streetAddress", "streetNumber", "area", "city", "apartment",
    "emergencyContactName", "emergencyContactNumber",
  ];

  // Skip required-field validation when confirming outdated info (no changes)
  const missing =
    changed || (!changed && !forceUpdate && !showWarning)
      ? requiredFields.filter((f) => !formData[f] || String(formData[f]).trim() === "")
      : [];

  if (missing.length > 0) {
    setErrorFields(missing);
    setSnackbar({
      open: true,
      message: "Please fill in all required fields before updating.",
      severity: "error",
    });
    return;
  }

  const account = accounts[0];
  const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
  setLoading(true);

  const payload = {
    oid,
    update: true,
    ...formData,
    confirmationOnly: !changed && (forceUpdate || showWarning), // tells Logic App this was just confirmation
  };

  fetch(urlUserInfo, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Logic App may not return JSON
      try {
        return await res.json();
      } catch {
        return null;
      }
    })
    .then(() => {
      setSnackbar({
        open: true,
        message:
          !changed && (forceUpdate || showWarning)
            ? "Information confirmed successfully."
            : "Information updated successfully.",
        severity: "success",
      });
      originalData.current = formData;
      setChanged(false);

      // ✅ Hide warning everywhere after success
      setShowWarning(false);
      localStorage.setItem("needsUpdate", "false");
      navigate("/personal-info", { replace: true, state: { forceUpdate: false } });
    })
    .catch((err) => {
      console.error("Update error:", err);
      setSnackbar({
        open: true,
        message: "Failed to update information.",
        severity: "error",
      });
    })
    .finally(() => setLoading(false));
};

useEffect(() => {
  if (localStorage.getItem("needsUpdate") === "false") {
    setShowWarning(false);
  }
}, []);


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

      {showWarning && (
  <Alert
    severity="warning"
    sx={{
      mt: 2,
      mb: 2,
      maxWidth: "700px",
      borderRadius: "10px",
      backgroundColor: "#fffbe6",
      border: "1px solid #ffe58f",
    }}
  >
    Our records show you haven’t updated your personal information in over 2 years.  
    Please review your details and press <strong>“Update Information”</strong> to confirm.
  </Alert>
)}



      <Paper elevation={3} sx={{ mt: 4, p: 4, backgroundColor: "#fff", borderRadius: 2 }}>
        {/* 📋 Personal Information */}
        <Paper
  elevation={1}
  sx={{
    p: 3,
    mb: 4,
    backgroundColor: "#f9fafb",
    borderRadius: 2,
  }}
>
  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
    📋 Personal Information
  </Typography>

  <Grid container spacing={3}>
    {/* Read-only fields */}
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="Full Name"
        name="fullName"
        value={formData.fullName}
        disabled
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="Employee ID"
        name="employeeId"
        value={formData.employeeId}
        disabled
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="Phone"
        name="phone"
        value={formData.phone}
        disabled
      />
    </Grid>

    {/* Editable fields (still inside the same card) */}
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


        {/* 🪪 Identification */}
        <Paper elevation={1} sx={{ mt: 4, p: 3, backgroundColor: "#f9fafb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            🪪 Identification Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="National ID Number"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                error={errorFields.includes("nationalId")}
                helperText={errorFields.includes("nationalId") ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="National ID Expiration Date"
                name="nationalIdExpiration"
                value={formData.nationalIdExpiration || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Nationality"
                name="nationality"
                value={formData.nationality || ""}
                onChange={handleChange}
                error={errorFields.includes("nationality")}
                helperText={errorFields.includes("nationality") ? "Required" : ""}
              >
                {withCurrentOption(NATIONALITY_OPTIONS, formData.nationality).map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* 🏠 Residential Address */}
        <Paper elevation={1} sx={{ mt: 4, p: 3, backgroundColor: "#f9fafb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            🏠 Residential Address
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={errorFields.includes("postalCode")}
                helperText={errorFields.includes("postalCode") ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                select
                fullWidth
                label="Street Address"
                name="streetAddress"
                value={formData.streetAddress || ""}
                onChange={handleChange}
                SelectProps={{ displayEmpty: true }}
                InputProps={{
                  endAdornment: addressLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
                }}
                error={errorFields.includes("streetAddress")}
                helperText={errorFields.includes("streetAddress") ? "Required" : ""}
              >
                {withCurrentOption(streetOptions, formData.streetAddress).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Street Number"
                name="streetNumber"
                value={formData.streetNumber}
                onChange={handleChange}
                error={errorFields.includes("streetNumber")}
                helperText={errorFields.includes("streetNumber") ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Area"
                name="area"
                value={formData.area}
                InputProps={{ readOnly: true }}
                error={errorFields.includes("area")}
                helperText={errorFields.includes("area") ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                InputProps={{ readOnly: true }}
                error={errorFields.includes("city")}
                helperText={errorFields.includes("city") ? "Required" : ""}
              />
            </Grid>
          

          
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Apartment"
                name="apartment"
                value={formData.apartment}
                onChange={handleChange}
                error={errorFields.includes("apartment")}
                helperText={errorFields.includes("apartment") ? "Required" : ""}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ☎️ Emergency Contact */}
        <Paper elevation={1} sx={{ mt: 4, p: 3, backgroundColor: "#f9fafb", borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            ☎️ Emergency Contact
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                error={errorFields.includes("emergencyContactName")}
                helperText={errorFields.includes("emergencyContactName") ? "Required" : ""}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact Number"
                name="emergencyContactNumber"
                value={formData.emergencyContactNumber}
                onChange={handleChange}
                error={errorFields.includes("emergencyContactNumber")}
                helperText={errorFields.includes("emergencyContactNumber") ? "Required" : ""}
              />
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3} mt={3} alignItems="center">
          <Grid item xs={12} textAlign="right">
            <Button variant="contained" color="success" disabled={(!changed && !forceUpdate && !showWarning) || loading}

 onClick={handleUpdate}>
              {loading ? <CircularProgress size={24} /> : "Update Information"}
            </Button>
          </Grid>
        </Grid>
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
