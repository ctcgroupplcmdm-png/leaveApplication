import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [phone, setPhone] = useState(null);
  const [remainingBalance, setRemainingBalance] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid;

      instance
        .acquireTokenSilent({
          ...loginRequest,
          account,
        })
        .then(async (response) => {
          const accessToken = response.accessToken;

          // 🔹 Step 1: Get user details (mobilePhone) from Graph
          const userRes = await fetch(
            `https://graph.microsoft.com/v1.0/users/${oid}?$select=mobilePhone`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const userData = await userRes.json();
          const userPhone = userData.mobilePhone || "Not available";
          setPhone(userPhone);

          if (!userData.mobilePhone) return;

          // 🔹 Step 2: Use phone number to query SharePoint list
          const spRes = await fetch(
            `https://cyprustrading.sharepoint.com/sites/ApplicationManagement/_api/web/lists/GetByTitle('Employee Annual Leave Status')/items?$filter=PhoneNumber eq '${userPhone}'&$select=Remainingbalance,PhoneNumber`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json;odata=nometadata",
              },
            }
          );

          const spData = await spRes.json();
          if (spData.value && spData.value.length > 0) {
            setRemainingBalance(spData.value[0].Remainingbalance);
          } else {
            setRemainingBalance("N/A");
          }
        })
        .catch((err) => console.error("Error fetching data:", err));
    }
  }, [accounts, instance]);

  if (accounts.length === 0) return <p>Not signed in</p>;

  return (
    <div>
      <p><b>Username:</b> {accounts[0].username}</p>
      <p><b>Phone:</b> {phone}</p>
      <p><b>Remaining Balance:</b> {remainingBalance}</p>
    </div>
  );
}

export default UserInfo;
