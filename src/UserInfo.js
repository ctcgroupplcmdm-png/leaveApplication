import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [phone, setPhone] = useState(null);
  const [objectId, setObjectId] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub; // 👈 safe grab
      setObjectId(oid);

      instance
        .acquireTokenSilent({
          ...loginRequest,
          account,
        })
        .then((response) => {
          const accessToken = response.accessToken;

          return fetch(
            `https://graph.microsoft.com/v1.0/users/${oid}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
        })
        .then((res) => res.json())
        .then((data) => {
          setPhone(data.mobilePhone || "Not available");
        })
        .catch((err) => console.error(err));
    }
  }, [accounts, instance]);

  if (accounts.length === 0) return <p>Not signed in</p>;

  return (
    <div>
      <p>
        <b>Username:</b> {accounts[0].username}
      </p>
      <p>
        <b>Object ID:</b> {objectId}
      </p>
      <p>
        <b>Phone:</b> {phone}</p>
    </div>
  );
}

export default UserInfo;
