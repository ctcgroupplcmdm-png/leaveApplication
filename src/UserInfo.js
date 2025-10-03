import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

function UserInfo() {
  const { accounts } = useMsal();
  const [userData, setUserData] = useState(null);
  const [leaves, setLeaves] = useState([]);

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

          // Parse leavesTaken if it's a string
          try {
            if (data.leavesTaken) {
              const parsedLeaves = JSON.parse(data.leavesTaken);
              setLeaves(parsedLeaves);
            }
          } catch (err) {
            console.error("Failed to parse leavesTaken", err);
          }
        })
        .catch((err) => console.error("Logic App call failed", err));
    }
  }, [accounts]);

  if (accounts.length === 0) return <p>Not signed in</p>;
  if (!userData) return <p>Loading...</p>;

  return (
    <div>
      <h2>User Info</h2>
      <p><b>Username:</b> {accounts[0].username}</p>
      <p><b>Name:</b> {userData.displayName}</p>
      <p><b>Phone:</b> {userData.mobilePhone}</p>
      <p><b>Employee ID:</b> {userData.employeeId}</p>

      <h3>Leave History</h3>
      {leaves.length > 0 ? (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th>Absence Description</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Working Days</th>
              <th>Deduction</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, index) => (
              <tr key={index}>
                <td>{leave["Absence Description"]}</td>
                <td>{leave["Start Date"]}</td>
                <td>{leave["End Date"]}</td>
                <td>{leave["Working Date"]}</td>
                <td>{leave["Annual Leave Deduction"]}</td>
                <td>{leave["Remaining Balance"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No leaves recorded.</p>
      )}
    </div>
  );
}

export default UserInfo;
