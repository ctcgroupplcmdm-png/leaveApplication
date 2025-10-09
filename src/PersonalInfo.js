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

// 🔽 Nationality options (trimmed EU + nearby for brevity; extend as needed)
const NATIONALITY_OPTIONS = [
  "Cyprus", "Åland Islands", "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan",
  "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czech Republic",
  "Denmark", "Estonia", "Faroe Islands", "Finland", "France", "Georgia", "Germany",
  "Gibraltar", "Greece", "Guernsey", "Hungary", "Iceland", "Ireland", "Isle of Man",
  "Italy", "Jersey", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta",
  "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland",
  "Portugal", "Romania", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain",
  "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom", "Vatican City",
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
    educationLevel: "",
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Address fetch + mapping
  const [addressLoading, setAddressLoading] = useState(false);
  const [streetOptions, setStreetOptions] = useState([]);
  const [addressMap, setAddressMap] = useState([]);

  const urlUserInfo =
    "https://prod-19.westeurope.logic.azure.com:443/workflows/0382cabb1f7d4771bc9b137b31cdd987/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=5xbVtCTV5KeN_mp5q8ORiLCzLumKfMAlkWhryTHKjho";

  const urlAddressLookup =
    "https://prod-24.westeurope.logic.azure.com:443/workflows/f0e93ec5ec1343a6bd52326577282aca/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=0c8NQEn0LBb8i5jEBUgpns8y8hSFZqOsG19f_Ktwzkw";

  // ✅ Fetch user info (prefill)
  const fetchUserInfo = (oid) => {
    setLoading(true);
    fetch(urlUserInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, update: false }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Emergency contact fallback logic: if only number is returned under "Name"
        let ecName = data["Emergency Contact Name"] ?? "";
        let ecNumber = data["Emergency Contact Number"] ?? "";

        const ecNameStr = String(ecName ?? "");
        if (!ecNumber && /^\d{5,}$/.test(ecNameStr)) {
          // looks like a phone number accidentally placed in Name
          ecNumber = ecNameStr;
          ecName = "";
        }

        const normalized = {
          fullName: data.FullName || "",
          employeeId: data.EmployeeId?.toString() || "",
          phone: data.Phone?.toString() || "",
          personalEmail: data.PersonalEmail || data["Personal Email"] || "",
          maritalStatus: data["Marital Status"] || "",
          educationLevel: data.EducationalLevel || "",
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

  // ✅ Fetch addresses by postal code (when length is 4)
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
    } catch (err) {
      console.error("Address lookup error:", err);
      setAddressMap([]);
      setStreetOptions(["Error retrieving addresses"]);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 4) {
      fetchAddressesByPostalCode(formData.postalCode);
    }
  }, [formData.postalCode]);

  // change detection
  const hasChanges = (current, original) =>
    Object.keys(current).some(
      (key) => key !== "companyName" && (original?.[key] ?? "") !== (current?.[key] ?? "")
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // When street changes, auto-fill area/city from the selected address
    if (name === "streetAddress") {
      const selected = addressMap.find((a) => a.Street === value);
      if (selected) {
        updated = { ...updated, area: selected.Area, city: selected.City };
      }
    }

    setFormData(updated);
    setChanged(hasChanges(updated, originalData.current));
  };

  // ✅ Update info (only if changed)
  const handleUpdate = () => {
    if (!changed) return;
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
        setSnackbar({
          open: true,
          message: "Information updated successfully.",
          severity: "success",
        });
        originalData.current = formData;
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

  // initial load
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

  // options incl. current
  const nationalityOptions = withCurrentOption(NATIONALITY_OPTIONS, formData.nationality);
  const streetDropdownOptions = withCurrentOption(streetOptions, formData.streetAddress);

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
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

        <Grid item sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate("/")}>
            ← Back
          </Button>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {formData.employeeId}
      </Typography>

      <Paper elevation={3} sx={{ mt: 4, p: 4, backgroundColor: "#fff", borderRadius: 2 }}>
        {/* 🔒 Identity (readonly) */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5", userSelect: "none" } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={formData.employeeId}
              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5", userSelect: "none" } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5", userSelect: "none" } }}
            />
          </Grid>
        </Grid>

        {/* ✏️ Editable basics */}
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Personal Email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Marital Status"
              name="maritalStatus"
              value={formData.maritalStatus || ""}
              onChange={handleChange}
            >
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Not married">Not married</MenuItem>
              <MenuItem value="Widow/Widower">Widow/Widower</MenuItem>
              <MenuItem value="Divorced">Divorced</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
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
              <MenuItem value="Bachelor's Degree">Bachelor's Degree</MenuItem>
              <MenuItem value="Masters Degree">Masters Degree</MenuItem>
              <MenuItem value="Doctoral Degree">Doctoral Degree</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Gender"
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* 🪪 Identification Details */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mt: 4,
            backgroundColor: "#f9fafb",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
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
        <Paper
          elevation={1}
          sx={{ mt: 4, p: 3, backgroundColor: "#f9fafb", borderRadius: 2, border: "1px solid #e0e0e0" }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            🏠 Residential Address
          </Typography>

          {/* Row 1: 5 fields on desktop */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
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
                InputProps={{
                  endAdornment: addressLoading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ) : null,
                }}
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
              />
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                disabled
              />
            </Grid>

            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled
              />
            </Grid>

            {/* Row 2: Apartment alone in first slot to keep 5-per-row rhythm, remaining empty slots are fine */}
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                label="Apartment"
                name="apartment"
                value={formData.apartment}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ☎️ Emergency Contact */}
        <Grid container spacing={3} mt={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Emergency Contact Number"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6} textAlign="right">
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
