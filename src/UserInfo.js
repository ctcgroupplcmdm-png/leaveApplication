import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

// Logo imports
import argosyLogo from "./logos/argosy.png";
import ctcLogo from "./logos/ctc.png";
import artviewLogo from "./logos/artview.png";
import automotiveLogo from "./logos/automotive.png";
import cassandraLogo from "./logos/cassandra.png";
import wwlLogo from "./logos/wwl.png";
import apexLogo from "./logos/apex.png";
import nksLogo from "./logos/nks.png";
import limniLogo from "./logos/limni.png";

const logoMap = {
  "Argosy Trading Company Ltd": argosyLogo,
  "Cyprus Trading Corporation Plc": ctcLogo,
  "Artview Co. Ltd": artviewLogo,
  "CTC Automotive Ltd": automotiveLogo,
  "Cassandra Trading Ltd": cassandraLogo,
  "Woolworth (Cyprus) Properties Plc": wwlLogo,
  "Apex Ltd": apexLogo,
  "N.K. Shacolas (Holdings) Ltd": nksLogo,
  "Cyprus Limni Resorts & Golf Courses Plc": limniLogo,
};

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["Annual Leave"]);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

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
          if (data.leavesTaken) {
            const parsedLeaves = Array.isArray(data.leavesTaken)
              ? data.leavesTaken
              : JSON.parse(data.leavesTaken);
            setLeaves(parsedLeaves);

            // ✅ Always take the *first row* for Annual Allowance (even if hidden)
            const lastBalance =
              parsedLeaves[parsedLeaves.length - 1]?.["Remaining Balance"] || 0;
            setRemainingBalance(lastBalance);
          }

          setUserData({
            name: data.displayName,
            employeeId: data.employeeId,
            phone: data.mobilePhone,
            companyName: data.companyName,
          });
        })
        .catch((err) => console.error("Error fetching Logic App data:", err));
    }
  }, [accounts]);

  const logout = () => instance.logoutRedirect();

  if (!userData) return <Typography>Loading user data...</Typography>;

  // Get all leave types (except "Yearly Entitlement Balance" if it exists)
  const allLeaveTypes = [
    ...new Set(
      leaves
        .filter((l) => l["Absence Description"] !== "Yearly Entitlement Balance")
        .map((l) => l["Absence Description"])
    ),
  ];

  // Filter out "Yearly Entitlement Balance" from the display
  const filteredLeaves = leaves.filter(
    (l) =>
      l["Absence Description"] !== "Yearly Entitlement Balance" &&
      selectedTypes.includes(l["Absence Description"])
  );

  const toggleLeaveType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // ✅ Always pull Annual Allowance from the *first record in the full list*
  const annualAllowance = leaves[0]?.["Remaining Balance"] || 0;
  const logo = logoMap[userData.companyName] || ctcLogo;

  const colorMap = {
    "Annual Leave": "#e3f2fd",
    "Sick Leave": "#fce4ec",
    "Maternity Leave": "#e8f5e9",
    "Unpaid Leave": "#fff3e0",
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Row with Logo */}
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item sx={{ display: "flex", alignItems: "center" }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{ height: 70, width: "auto", marginRight: 15 }}
          />
          <Typography variant="h5" fontWeight="bold">
            {userData.companyName}
          </Typography>
        </Grid>

        <Grid item sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Chip
            label={`${annualAllowance} Annual Allowance`}
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
          <Chip
            label={`${remainingBalance || 0} Leave Days Remaining`}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* Welcome Section */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome {userData.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {userData.employeeId}
      </Typography>

      {/* Leave Records Header + Filters */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 4, mb: 2 }}
      >
        <Typography variant="h5" fontWeight="bold">
          Leave Records
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {allLeaveTypes.map((type, i) => (
            <FormControlLabel
              key={i}
              control={
                <Checkbox
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleLeaveType(type)}
                />
              }
              label={type}
            />
          ))}
          <Button
            variant="contained"
            sx={{ textTransform: "none", backgroundColor: "#1976d2" }}
          >
            + New Leave Request
          </Button>
        </Box>
      </Grid>

      {/* Leave Records Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
            <TableRow>
              <TableCell><b>Leave Type</b></TableCell>
              <TableCell><b>Start Date</b></TableCell>
              <TableCell><b>End Date</b></TableCell>
              <TableCell><b>Days Deducted</b></TableCell>
              <TableCell><b>Remaining Balance</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeaves.map((leave, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor:
                    colorMap[leave["Absence Description"]] || "white",
                }}
              >
                <TableCell>{leave["Absence Description"]}</TableCell>
                <TableCell>{leave["Start Date"]}</TableCell>
                <TableCell>{leave["End Date"]}</TableCell>
                <TableCell>{leave["Annual Leave Deduction"]}</TableCell>
                <TableCell>{leave["Remaining Balance"]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default UserInfo;
