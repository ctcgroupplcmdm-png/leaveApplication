import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [phone, setPhone] = useState(null);
  const [objectId, setObjectId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
      setObjectId(oid);

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
          setPhone(data.mobilePhone || "Not available");
          setEmployeeId(data.employeeId || "N/A");
          setDisplayName(data.displayName || "Unknown");
          if (data.leavesTaken) {
            try {
              const parsed = JSON.parse(data.leavesTaken);
              setLeaves(parsed);
            } catch (e) {
              console.error("Invalid JSON in leavesTaken", e);
            }
          }
        })
        .catch((err) => console.error("Error fetching Logic App data:", err));
    }
  }, [accounts]);

  const logout = () => instance.logoutRedirect();

  if (accounts.length === 0) return <p>Not signed in</p>;

  const filteredLeaves =
    filterType === "All"
      ? leaves
      : leaves.filter((l) => l["Absence Description"] === filterType);

  const leaveTypes = ["All", ...new Set(leaves.map((l) => l["Absence Description"]))];
  const annualAllowance = leaves[0]?.["Remaining Balance"] || 0;
  const daysRemaining = leaves[leaves.length - 1]?.["Remaining Balance"] || 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Welcome, {displayName}</h2>
          <p style={styles.info}><b>Employee ID:</b> {employeeId}</p>
<p style={styles.info}><b>Object ID:</b> {objectId}</p>
<p style={styles.info}><b>Phone:</b> {phone}</p>

        </div>
        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Annual Allowance</p>
          <h3 style={styles.cardValue}>{annualAllowance}</h3>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Days Remaining</p>
          <h3 style={styles.cardValue}>{daysRemaining}</h3>
        </div>
      </div>

      <div style={styles.filterRow}>
        <h3>Leave Records</h3>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.dropdown}
        >
          {leaveTypes.map((t, i) => (
            <option key={i}>{t}</option>
          ))}
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days Deducted</th>
            <th>Remaining Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeaves.map((leave, i) => (
            <tr key={i} style={styles.tableRow}>
              <td>{leave["Absence Description"]}</td>
              <td>{leave["Start Date"]}</td>
              <td>{leave["End Date"]}</td>
              <td>{leave["Annual Leave Deduction"]}</td>
              <td>{leave["Remaining Balance"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Inter, Arial, sans-serif",
    maxWidth: "900px",
    margin: "40px auto",
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "30px 40px",
    boxShadow: "0 4px 25px rgba(0,0,0,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { fontSize: "24px", marginBottom: "5px" },
  info: { color: "#555", margin: "3px 0" },
  logoutButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "0.2s",
  },
  summaryRow: {
    display: "flex",
    gap: "20px",
    marginTop: "10px",
  },
  card: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  cardLabel: { color: "#6b7280", fontSize: "14px" },
  cardValue: { fontSize: "28px", color: "#2563eb", margin: "8px 0" },
  filterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "30px",
  },
  dropdown: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
  tableRow: {
    textAlign: "center",
    borderBottom: "1px solid #e5e7eb",
  },
};

export default UserInfo;
