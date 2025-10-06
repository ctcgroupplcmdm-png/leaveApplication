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
  CircularProgress,
} from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["Annual Leave"]); // Default filter
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const fetchLeaves = (year = currentYear) => {
    if (accounts.length === 0) return;
    setLoading(true);

    const account = accounts[0];
    const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;

    fetch(
      "https://prod-126.westeurope.logic.azure.com:443/workflows/c3bf058acb924c11925e5c660e1c3b5a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=tWDPd-5b4hzpzvJJjelfZCARBviG3gIJdTLHnXttUFg",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oid, year }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.leavesTaken) {
          const parsedLeaves = JSON.parse(data.leavesTaken);
          const filtered = parsedLeaves.filter(
            (l) => l["Absence Description"] !== "Yearly Entitlement Balance"
          );
          setLeaves(filtered);

          const lastBalance =
            filtered[filtered.length - 1]?.["Remaining Balance"] || 0;
          setRemainingBalance(lastBalance);
        }

        setUserData({
          name: data.displayName,
          employeeId: data.employeeId,
          phone: data.mobilePhone,
          companyName: data.companyName || "Company",
        });
      })
      .catch((err) => console.error("Error fetching Logic App data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line
  }, [accounts]);

  if (!userData) return <Typography>Loading user data...</Typography>;

  const filteredLeaves = leaves.filter((leave) =>
    selectedTypes.includes(leave["Absence Description"])
  );

  const leaveTypes = [...new Set(leaves.map((l) => l["Absence Description"]))];

  const handleTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const getRowColor = (type) => {
    switch (type) {
      case "Annual Leave":
        return "#e3f2fd";
      case "Sick Leave":
        return "#fce4ec";
      case "Maternity Leave":
        return "#f3e5f5";
      default:
        return "#ffffff";
    }
  };

  const logout = () => instance.logoutRedirect();

  const generatePDF = () => {
    if (!filteredLeaves.length) {
      alert("No leave data to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(
      `${userData.companyName} - Leave Report (${selectedYear})`,
      14,
      20
    );
    doc.setFontSize(12);
    doc.text(`Employee: ${userData.name}`, 14, 30);
    doc.text(`Employee ID: ${userData.employeeId}`, 14, 38);
    doc.text(`Phone: ${userData.phone}`, 14, 46);

    const tableData = filteredLeaves.map((leave) => [
      leave["Absence Description"],
      leave["Start Date"],
      leave["End Date"],
      leave["Annual Leave Deduction"],
      leave["Remaining Balance"],
    ]);

    doc.autoTable({
      head: [["Leave Type", "Start Date", "End Date", "Days Deducted", "Remaining Balance"]],
      body: tableData,
      startY: 55,
    });

    doc.save(`Leave_Report_${selectedYear}.pdf`);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Bar */}
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        {/* Logo + Company Name */}
        <Grid item sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {userData?.companyName && companyLogos[userData.companyName] && (
            <img
              src={require(`./assets/logos/${companyLogos[userData.companyName]}`)}
              alt={userData.companyName}
              style={{ width: 50, height: 50, objectFit: "contain" }}
            />
          )}
          <Typography variant="h6" fontWeight="bold">
            {userData.companyName}
          </Typography>
        </Grid>

        {/* Stats + Logout */}
        <Grid item sx={{ display: "flex", gap: 2 }}>
          <Chip
            label={`${leaves[0]?.["Remaining Balance"] || 0} Annual Allowance`}
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

      {/* Welcome Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome {userData.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {userData.employeeId}
      </Typography>

      {/* Leave Records Section */}
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
          <FormGroup row>
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

          {/* Year buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {[currentYear, previousYear].map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedYear(year);
                  fetchLeaves(year);
                }}
                disabled={loading}
                sx={{ textTransform: "none" }}
              >
                {loading && selectedYear === year ? (
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                ) : null}
                {year}
              </Button>
            ))}
          </Box>

          {/* PDF Export */}
          <Button
            variant="outlined"
            color="primary"
            onClick={generatePDF}
            sx={{ textTransform: "none" }}
          >
            Save as PDF
          </Button>
        </Box>
      </Grid>

      {/* Leave Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
            <TableRow>
              <TableCell>
                <b>Leave Type</b>
              </TableCell>
              <TableCell>
                <b>Start Date</b>
              </TableCell>
              <TableCell>
                <b>End Date</b>
              </TableCell>
              <TableCell>
                <b>Days Deducted</b>
              </TableCell>
              <TableCell>
                <b>Remaining Balance</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeaves.map((leave, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: getRowColor(leave["Absence Description"]),
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
