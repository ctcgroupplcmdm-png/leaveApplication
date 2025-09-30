import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useEffect, useState } from "react";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (account) {
      // Get token silently
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: account
        })
        .then((response) => {
          // Call Microsoft Graph
          return fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });
        })
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
        })
        .catch((error) => {
          console.error("Graph error:", error);
        });
    }
  }, [account, instance]);

  if (!account) return <p>Not signed in</p>;
  if (!user) return <p>Loading user info...</p>;

  return (
    <div>
      <p><b>Username:</b> {account.username}</p>
      <p><b>Name:</b> {user.displayName}</p>
      <p><b>Email:</b> {user.mail || user.userPrincipalName}</p>
      <p><b>Phone:</b> {user.mobilePhone || "Not available"}</p>
    </div>
  );
}

export default UserInfo;
