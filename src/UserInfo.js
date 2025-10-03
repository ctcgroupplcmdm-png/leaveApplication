import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, CircularProgress
} from "@mui/material";

function UserInfo() {
  const { accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setUserData(data);
          try {
            if (data.leavesTaken) {
              const parsedLeaves = JSON.parse(data.leavesTaken);
              setLeaves(parsedLeaves);
            }
          } catch (err) {
            console.error("Failed to parse leavesTaken", err);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Logic App call failed", err);
          setLoading(false);
        });
    }
  }, [accounts]);

  if (accounts.length === 0) return <Typography>Not signed in</Typography>;
  if (loading) return <CircularProgress />;

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userData?.displayName}
      </Typography>
      <Typography variant="body1"><b>Username:</b> {accounts[0].username}</Typography>
      <Typography variant="body1"><b>Employee ID:</b> {userData?.employeeId}</Typography>
      <Typography variant="body1"><b>Phone:</b> {userData?.mobilePhone}</Typography>

      <Typography variant="h5" style={{ marginTop: "30px" }} gutterBottom>
        Leave History
      </Typography>

      {leaves.length > 0 ? (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow style={{ backgroundColor: "#1976d2" }}>
                <TableCell style={{ color: "white" }}>Absence Description</TableCell>
                <TableCell style={{ color: "white" }}>Start Date</TableCell>
                <TableCell style={{ color: "white" }}>End Date</TableCell>
                <TableCell style={{ color: "white" }}>Working Days</TableCell>
                <TableCell style={{ color: "white" }}>Deduction</TableCell>
                <TableCell style={{ color: "white" }}>Remaining Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((leave, index) => (
                <TableRow key={index} hover>
                  <TableCell>{leave["Absence Description"]}</TableCell>
                  <TableCell>{leave["Start Date"]}</TableCell>
                  <TableCell>{leave["End Date"]}</TableCell>
                  <TableCell>{leave["Working Date"]}</TableCell>
                  <TableCell>{leave["Annual Leave Deduction"]}</TableCell>
                  <TableCell>{leave["Remaining Balance"]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No leave records found.</Typography>
      )}
    </div>
  );
}

export default UserInfo;
