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
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [annualAllowance, setAnnualAllowance] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);

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
            const parsedLeaves = JSON.parse(data.leavesTaken);

            // Remove the "Yearly Entitlement Balance" row
            const filteredLeaves = parsedLeaves.filter(
              (l) => l["Absence Description"] !== "Yearly Entitlement Balance"
            );
            setLeaves(filteredLeaves);

            // First entry = Annual Allowance
            const firstBalance = parsedLeaves[0]?.["Remaining Balance"] || 0;
            setAnnualAllowance(firstBalance);

            // Last entry = Remaining Balance
            const lastBalance =
              parsedLeaves[parsedLeaves.length - 1]?.["Remaining Balance"] || 0;
            setRemainingBalance(lastBalance);
          }

          setUserData({
            name: data.displayName,
            employeeId: data.employeeId,
            phone: data.mobilePhone,
          });
        })
        .catch((err) => console.error("Error fetching Logic App data:", err));
    }
  }, [accounts]);

  if (!userData) return <Typography>Loading user data...</Typography>;

  const logout = () => instance.logoutRedirect();

  // Unique leave types (excluding "Yearly Entitlement Balance")
  const leaveTypes = [
    ...new Set(leaves.map((l) => l["Absence Description"])),
  ];

  // Handle checkbox change
  const handleTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Apply filter
  const filteredLeaves =
    selectedTypes.length === 0
      ? leaves
      : leaves.filter((l) => selectedTypes.includes(l["Absence Description"]));

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Bar */}
      <Grid container spacing={2} justifyContent="flex-end" sx={{ mb: 3 }}>
        <Grid item>
          <Chip
            label={`${annualAllowance || 0}  Annual Allowance`}
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
        </Grid>
        <Grid item>
          <Chip
            label={`${remainingBalance || 0}  Leave Days Remaining`}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
        </Grid>
        <Grid item>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* Welcome Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome {userData.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {userData.employeeId}
      </Typography>

      {/* Leave Records Section */}
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        Leave Records
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 2, textTransform: "none", backgroundColor: "#1976d2" }}
      >
        + New Leave Request
      </Button>

      {/* Inline Checkboxes for Leave Type Filters */}
      <FormGroup row sx={{ mb: 2 }}>
        {leaveTypes.map((type, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeChange(type)}
              />
            }
            label={type}
          />
        ))}
      </FormGroup>

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
              <TableRow key={index}>
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
