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
// 🔽 Static options (you can expand later)
const NATIONALITY_OPTIONS = ["Cyprus", "Greece", "United Kingdom", "Other"];
const STREET_OPTIONS = ["Omonoias", "Archangelou", "Other"];
// Helper: include current value from flow if not already in options
const withCurrentOption = (options, current) => {
 if (!current) return options;
 return options.includes(current) ? options : [current, ...options];
};
function PersonalInfo() {
 const { instance, accounts } = useMsal();
 const navigate = useNavigate();
 const originalData = useRef(null);
 const [userData, setUserData] = useState(null); // used for header + company name
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
   emergencyContact: "",
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
 // ✅ Fetch user info from Logic App (prefill)
 const fetchUserInfo = (oid) => {
   setLoading(true);
   fetch(url, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ oid, update: false }),
   })
     .then((res) => res.json())
     .then((data) => {
       // Normalize keys from your sample
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
         emergencyContact: data["Emergency Contact Name"]?.toString() || "",
       };
       setUserData({
         companyName: normalized.companyName,
       });
       setFormData(normalized);
       originalData.current = normalized;
       setChanged(false);
     })
     .catch((err) => console.error("Error fetching info:", err))
     .finally(() => setLoading(false));
 };
 // Compare to detect real changes
 const hasChanges = (current, original) =>
   Object.keys(current).some(
     (key) => key !== "companyName" && (original?.[key] ?? "") !== (current?.[key] ?? "")
   );
 const handleChange = (e) => {
   const { name, value } = e.target;
   const updated = { ...formData, [name]: value };
   setFormData(updated);
   setChanged(hasChanges(updated, originalData.current));
 };
 // ✅ Update info (only when there are real changes)
 const handleUpdate = () => {
   if (!changed) return;
   const account = accounts[0];
   const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
   setLoading(true);
   fetch(url, {
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
 // Build select options that include current values
 const nationalityOptions = withCurrentOption(NATIONALITY_OPTIONS, formData.nationality);
 const streetOptions = withCurrentOption(STREET_OPTIONS, formData.streetAddress);
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
     {/* Title & Key Info */}
<Typography variant="h4" fontWeight="bold" gutterBottom>
       Personal Information
</Typography>
<Typography variant="subtitle1" color="text.secondary" gutterBottom>
       Employee ID: {formData.employeeId}
</Typography>
     {/* Form Container */}
<Paper elevation={3} sx={{ mt: 4, p: 4, backgroundColor: "#fff", borderRadius: 2 }}>
       {/* Readonly key identity fields */}
<Grid container spacing={3}>
<Grid item xs={12} md={4}>
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
<Grid item xs={12} md={4}>
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
<Grid item xs={12} md={4}>
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
</Grid>
       {/* Editable basics */}
<Grid container spacing={3} mt={1}>
<Grid item xs={12} md={4}>
<TextField
             fullWidth
             label="Personal Email"
             name="personalEmail"
             value={formData.personalEmail}
             onChange={handleChange}
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
</Grid>
       {/* 🪪 Identification Details */}
<Paper
         elevation={1}
         sx={{
           mt: 4,
           p: 3,
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
               {nationalityOptions.map((n) => (
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
         sx={{
           mt: 4,
           p: 3,
           backgroundColor: "#f9fafb",
           borderRadius: 2,
           border: "1px solid #e0e0e0",
         }}
>
<Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
           🏠 Residential Address
</Typography>
<Grid container spacing={3}>
<Grid item xs={12} md={6}>
<TextField
               select
               fullWidth
               label="Street Address"
               name="streetAddress"
               value={formData.streetAddress || ""}
               onChange={handleChange}
>
               {streetOptions.map((s) => (
<MenuItem key={s} value={s}>
                   {s}
</MenuItem>
               ))}
</TextField>
</Grid>
<Grid item xs={12} md={3}>
<TextField
               fullWidth
               label="Street Number"
               name="streetNumber"
               value={formData.streetNumber}
               onChange={handleChange}
             />
</Grid>
<Grid item xs={12} md={3}>
<TextField
               fullWidth
               label="Apartment"
               name="apartment"
               value={formData.apartment}
               onChange={handleChange}
             />
</Grid>
</Grid>
<Grid container spacing={3} mt={1}>
<Grid item xs={12} md={4}>
<TextField
               fullWidth
               label="Area"
               name="area"
               value={formData.area}
               onChange={handleChange}
             />
</Grid>
<Grid item xs={12} md={4}>
<TextField
               fullWidth
               label="City"
               name="city"
               value={formData.city}
               onChange={handleChange}
             />
</Grid>
<Grid item xs={12} md={4}>
<TextField
               fullWidth
               label="Postal Code"
               name="postalCode"
               value={formData.postalCode}
               onChange={handleChange}
             />
</Grid>
</Grid>
</Paper>
       {/* ✅ Final Row */}
<Grid container spacing={3} mt={3} alignItems="center">
<Grid item xs={12} md={6}>
<TextField
             fullWidth
             label="Emergency Contact Name / Number"
             name="emergencyContact"
             value={formData.emergencyContact}
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