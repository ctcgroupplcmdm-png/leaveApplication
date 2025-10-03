import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

function UserInfo() {
  const { instance, accounts } = useMsal();
  const [phone, setPhone] = useState(null);
  const [objectId, setObjectId] = useState(null);
  const [remainingBalance, setRemainingBalance] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
      setObjectId(oid);

      // 🔹 Step 1: Call Logic App to resolve mobile phone
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
          const userPhone = data.mobilePhone || "Not available";
          setPhone(userPhone);

          if (userPhone && userPhone !== "Not available") {
            // 🔹 Step 2: Acquire SharePoint token
            instance
              .acquireTokenSilent({
                ...loginRequest,
                account,
              })
              .then((response) => {
                const spToken = response.accessToken;

                // 🔹 Step 3: Query SharePoint with token
                return fetch(
                  `https://cyprustrading.sharepoint.com/sites/ApplicationManagement/_api/web/lists/GetByTitle('Employee Annual Leave Status')/items?$filter=PhoneNumber eq '${userPhone}'&$select=Remainingbalance,PhoneNumber`,
                  {
                    method: "GET",
                    headers: {
                      Accept: "application/json;odata=nometadata",
                      Authorization: `Bearer ${spToken}`, // ✅ now authenticated
                    },
                  }
                );
              })
              .then((spRes) => spRes.json())
              .then((spData) => {
                if (spData.value && spData.value.length > 0) {
                  setRemainingBalance(spData.value[0].Remainingbalance);
                } else {
                  setRemainingBalance("N/A");
                }
              })
              .catch((err) => {
                console.error("SharePoint fetch failed:", err);
                setRemainingBalance("N/A");
              });
          }
        })
        .catch((err) => {
          console.error("Logic App call failed:", err);
          setPhone("Not available");
          setRemainingBalance("N/A");
        });
    }
  }, [accounts, instance]);

  if (accounts.length === 0) return <p>Not signed in</p>;

  return (
    <div>
      <p><b>Username:</b> {accounts[0].username}</p>
      <p><b>Object ID:</b> {objectId}</p>
      <p><b>Phone:</b> {phone || "Not available"}</p>
      <p><b>Remaining Balance:</b> {remainingBalance || "N/A"}</p>
    </div>
  );
}

export default UserInfo;
