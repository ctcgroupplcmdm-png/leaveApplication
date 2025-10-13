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
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const withCurrentOption = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

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
  const [userNeedsUpdate, setUserNeedsUpdate] = useState(false);

  const urlUserInfo =
    "https://prod-19.westeurope.logic.azure.com:443/workflows/0382cabb1f7d4771bc9b137b31cdd987/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=5xbVtCTV5KeN_mp5q8ORiLCzLumKfMAlkWhryTHKjho";
  const urlAddressLookup =
    "https://prod-24.westeurope.logic.azure.com:443/workflows/f0e93ec5ec1343a6bd52326577282aca/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=0c8NQEn0LBb8i5jEBUgpns8y8hSFZqOsG19f_Ktwzkw";
  const urlUserStatus =
    "https://prod-165.westeurope.logic.azure.com:443/workflows/c484da6f94ad4cd5aea8a92377375728/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=Bt8eh3QsyGHRYRmzqf2S0ujsaGxgxyVqUyCpYQmiIMY";

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

  useEffect(() => {
    if (formData.postalCode && formData.postalCode.length === 4) {
      fetchAddressesByPostalCode(formData.postalCode);
    }
  }, [formData.postalCode]);

  const hasChanges = (current, original) =>
    Object.keys(current).some(
      (key) => key !== "companyName" && (original?.[key] ?? "") !== (current?.[key] ?? "")
    );

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
  const handleUpdate = () => {
    if (!changed && !userNeedsUpdate) return;
    const requiredFields = [
      "fullName", "employeeId", "phone", "personalEmail", "maritalStatus",
      "educationalLevel", "gender", "nationalId", "nationality", "postalCode",
      "streetAddress", "streetNumber", "area", "city", "apartment",
      "emergencyContactName", "emergencyContactNumber",
    ];
    const missing = requiredFields.filter(
      (f) => !formData[f] || String(formData[f]).trim() === ""
    );
    if (missing.length > 0) {
      setErrorFields(missing);
      setSnackbar({
        open: true,
        message: "Please fill in all required fields before updating.",
        severity: "error",
      });
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
        setSnackbar({
          open: true,
          message: "Information updated successfully.",
          severity: "success",
        });
        originalData.current = formData;
        setChanged(false);
        setUserNeedsUpdate(false);
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
      const oid = accounts[0]?.idTokenClaims?.oid || accounts[0]?.idTokenClaims?.sub;
      fetchUserInfo(oid);

      // 🟩 Fetch user status
      fetch(urlUserStatus, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oid }),
      })
        .then((res) => res.json())
        .then((data) => setUserNeedsUpdate(data.status === true))
        .catch((err) => console.error("Error fetching status:", err));
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

      {/* Main Form Card */}
      <Paper elevation={3} sx={{ mt: 4, p: 4, backgroundColor: "#fff", borderRadius: 2 }}>
        {/* ... All your form content unchanged ... */}

        {/* ✅ Update Button */}
        <Grid container spacing={3} mt={3} alignItems="center">
          <Grid item xs={12} textAlign="right">
            <Button
              variant={userNeedsUpdate ? "outlined" : "contained"}
              color={userNeedsUpdate ? "warning" : "success"}
              disabled={(!changed && !userNeedsUpdate) || loading}
              onClick={handleUpdate}
              sx={{
                borderWidth: userNeedsUpdate ? 2 : 1,
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
              {loading ? (
                <CircularProgress size={24} />
              ) : userNeedsUpdate ? (
                <>⚠️ Needs Update — Click to Confirm</>
              ) : (
                "Update Information"
              )}
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
