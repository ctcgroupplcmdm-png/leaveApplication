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
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["Annual Leave"]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const fetchLeaveData = (oid, year) => {
    setLoading(true);
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

          // Find "Yearly Entitlement Balance" row first (hidden row)
          const entitlementRow = parsedLeaves.find(
            (l) => l["Absence Description"] === "Yearly Entitlement Balance"
          );
          const annualAllowance =
            entitlementRow?.["Remaining Balance"] || 0;

          // Filter visible rows
          const filtered = parsedLeaves.filter(
            (l) => l["Absence Description"] !== "Yearly Entitlement Balance"
          );
          setLeaves(filtered);

          const lastBalance =
            filtered[filtered.length - 1]?.["Remaining Balance"] || 0;
          setRemainingBalance({ annualAllowance, lastBalance });
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
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
      fetchLeaveData(oid, selectedYear);
    }
  }, [accounts, selectedYear]);

  if (!userData) return <Typography>Loading user data...</Typography>;

  const handleTypeChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const filteredLeaves = leaves.filter((leave) =>
    selectedTypes.includes(leave["Absence Description"])
  );

  const leaveTypes = [...new Set(leaves.map((l) => l["Absence Description"]))];

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

  // 🧾 Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);

    // Header with logo + company name
    const logoFile = companyLogos[userData.companyName]
      ? require(`./assets/logos/${companyLogos[userData.companyName]}`)
      : null;
    if (logoFile) {
      const img = new Image();
      img.src = logoFile;
      doc.addImage(img, "PNG", 15, 10, 25, 25);
    }

    doc.text(userData.companyName, 50, 20);
    doc.setFontSize(12);
    doc.text(`Employee: ${userData.name}`, 50, 30);
    doc.text(`Employee ID: ${userData.employeeId}`, 50, 37);
    doc.text(`Year: ${selectedYear}`, 50, 44);

    // Leave records table
    autoTable(doc, {
      startY: 55,
      head: [["Type", "Start", "End", "Days", "Remaining"]],
      body: filteredLeaves.map((l) => [
        l["Absence Description"],
        l["Start Date"],
        l["End Date"],
        l["Annual Leave Deduction"],
        l["Remaining Balance"],
      ]),
    });

    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(
      `Annual Allowance: ${remainingBalance?.annualAllowance || 0} | Remaining Balance: ${
        remainingBalance?.lastBalance || 0
      }`,
      15,
      lastY
    );

    doc.save(`Leave_Records_${selectedYear}.pdf`);
  };

  const currentYear = new Date().getFullYear();

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
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
          )}
          <Typography variant="h6" fontWeight="bold">
            {userData.companyName}
          </Typography>
        </Grid>

        {/* Stats + Back + Logout */}
        <Grid item sx={{ display: "flex", gap: 2 }}>
          
          <Chip
            label={`${remainingBalance?.annualAllowance || 0} Annual Allowance`}
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
          <Chip
            label={`${remainingBalance?.lastBalance || 0} Leave Days Remaining`}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
		  <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            ← Back
          </Button>
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* Welcome */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome {userData.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {userData.employeeId}
      </Typography>

      {/* Leave Section Header */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 4, mb: 2 }}
      >
        <Grid item sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Leave Records
          </Typography>
          <Button
            variant={selectedYear === currentYear ? "contained" : "outlined"}
            onClick={() => setSelectedYear(currentYear)}
            disabled={loading}
          >
            {loading && selectedYear === currentYear ? (
              <CircularProgress size={18} />
            ) : (
              currentYear
            )}
          </Button>
          <Button
            variant={
              selectedYear === currentYear - 1 ? "contained" : "outlined"
            }
            onClick={() => setSelectedYear(currentYear - 1)}
            disabled={loading}
          >
            {loading && selectedYear === currentYear - 1 ? (
              <CircularProgress size={18} />
            ) : (
              currentYear - 1
            )}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={exportToPDF}
            sx={{ ml: 2 }}
          >
            Save as PDF
          </Button>
        </Grid>

        {/* Filters + New Leave */}
        <Grid
          item
          sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}
        >
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
          <Button
            variant="contained"
            sx={{ textTransform: "none", backgroundColor: "#1976d2" }}
          >
            + New Leave Request
          </Button>
        </Grid>
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
