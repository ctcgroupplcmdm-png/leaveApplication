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
  const [filterTypes, setFilterTypes] = useState(["Annual Leave"]);

  // 🔹 Map company names to logo paths
  const logoMap = {
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

  // 🔹 Load company logo safely
  const getLogo = (companyName) => {
    const logoFile = logoMap[companyName];
    try {
      return require(`./logos/${logoFile}`);
    } catch {
      return require(`./logos/default.png`); // fallback logo
    }
  };

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
            const parsedLeaves = JSON.parse(data.leavesTaken).filter(
              (row) => row["Absence Description"] !== "Yearly Entitlement Balance"
            );
            setLeaves(parsedLeaves);

            // Take first hidden row (Yearly Entitlement Balance) as annual allowance
            const hiddenRow = JSON.parse(data.leavesTaken).find(
              (row) => row["Absence Description"] === "Yearly Entitlement Balance"
            );
            const annualAllowance = hiddenRow?.["Remaining Balance"] || 0;

            const lastBalance =
              parsedLeaves[parsedLeaves.length - 1]?.["Remaining Balance"] || 0;
            setRemainingBalance({ last: lastBalance, annual: annualAllowance });
          }

          setUserData({
            name: data.displayName,
            employeeId: data.employeeId,
            phone: data.mobilePhone,
            company: data.companyName || "Unknown Company",
          });
        })
        .catch((err) => console.error("Error fetching Logic App data:", err));
    }
  }, [accounts]);

  const logout = () => instance.logoutRedirect();

  if (!userData) return <Typography>Loading user data...</Typography>;

  const companyLogo = getLogo(userData.company);
  const leaveTypes = [...new Set(leaves.map((l) => l["Absence Description"]))];

  const handleFilterChange = (type) => {
    setFilterTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const filteredLeaves = leaves.filter((l) =>
    filterTypes.includes(l["Absence Description"])
  );

  return (
    <Box sx={{ p: 4, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* 🔹 Top Bar */}
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item display="flex" alignItems="center" gap={2}>
          <img
            src={companyLogo}
            alt="Company Logo"
            style={{ width: "80px", height: "auto" }}
          />
          <Typography variant="h5" fontWeight="bold">
            {userData.company}
          </Typography>
        </Grid>

        <Grid item display="flex" gap={2}>
          <Chip
            label={`${remainingBalance?.annual || 0} Annual Allowance`}
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
          <Chip
            label={`${remainingBalance?.last || 0} Leave Days Remaining`}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem", p: 1 }}
          />
          <Button variant="outlined" color="error" onClick={logout}>
            Logout
          </Button>
        </Grid>
      </Grid>

      {/* 🔹 Welcome Section */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome {userData.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Employee ID: {userData.employeeId}
      </Typography>

      {/* 🔹 Actions & Filters */}
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 2 }}>
        <Grid item>
          <Button
            variant="contained"
            sx={{ textTransform: "none", backgroundColor: "#1976d2" }}
          >
            + New Leave Request
          </Button>
        </Grid>

        <Grid item>
          <FormGroup row>
            {leaveTypes.map((type, i) => (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    checked={filterTypes.includes(type)}
                    onChange={() => handleFilterChange(type)}
                    sx={{
                      color: "#1976d2",
                      "&.Mui-checked": { color: "#1976d2" },
                    }}
                  />
                }
                label={type}
              />
            ))}
          </FormGroup>
        </Grid>
      </Grid>

      {/* 🔹 Table */}
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
            {filteredLeaves.map((leave, index) => {
              const colorMap = {
                "Annual Leave": "#e3f2fd",
                "Sick Leave": "#fce4ec",
                "Unpaid Leave": "#fff3e0",
                "Maternity Leave": "#ede7f6",
              };
              const bgColor = colorMap[leave["Absence Description"]] || "#ffffff";

              return (
                <TableRow key={index} sx={{ backgroundColor: bgColor }}>
                  <TableCell>{leave["Absence Description"]}</TableCell>
                  <TableCell>{leave["Start Date"]}</TableCell>
                  <TableCell>{leave["End Date"]}</TableCell>
                  <TableCell>{leave["Annual Leave Deduction"]}</TableCell>
                  <TableCell>{leave["Remaining Balance"]}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default UserInfo;
