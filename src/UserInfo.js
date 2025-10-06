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

  // Filter leave types
  const filteredLeaves =
    filterType === "All"
      ? leaves
      : leaves.filter((l) => l["Absence Description"] === filterType);

  const leaveTypes = ["All", ...new Set(leaves.map((l) => l["Absence Description"]))];
  const annualAllowance = leaves[0]?.["Remaining Balance"] || 0;
  const daysRemaining = leaves[leaves.length - 1]?.["Remaining Balance"] || 0;

  return (
    <div style={{ fontFamily: "Arial", margin: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Welcome {displayName}</h2>
         <p style={styles.info}><b>Employee ID:</b> {employeeId}</p>
<p style={styles.info}><b>Object ID:</b> {objectId}</p>
<p style={styles.info}><b>Phone:</b> {phone}</p>

        </div>
        <div>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <div style={{ background: "#f1f1f1", padding: "10px", borderRadius: "8px" }}>
          <b>{annualAllowance}</b> Annual Allowance
        </div>
        <div style={{ background: "#f1f1f1", padding: "10px", borderRadius: "8px" }}>
          <b>{daysRemaining}</b> Leave Days Remaining
        </div>
      </div>

      <h3 style={{ marginTop: "30px" }}>Leave Records</h3>
      <div>
        <label>Filter by type: </label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {leaveTypes.map((t, i) => (
            <option key={i}>{t}</option>
          ))}
        </select>
      </div>

      <table style={{ width: "100%", marginTop: "15px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f9f9f9" }}>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days Deducted</th>
            <th>Remaining Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredLeaves.map((leave, i) => (
            <tr key={i} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
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

export default UserInfo;
