import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

function UserInfo() {
  const { accounts } = useMsal();
  const [phone, setPhone] = useState(null);
  const [objectId, setObjectId] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts[0];
      const oid = account.idTokenClaims?.oid || account.idTokenClaims?.sub;
      setObjectId(oid);

      // 🔹 Call Logic App with SAS token only
      fetch(
        "https://prod-126.westeurope.logic.azure.com:443/workflows/c3bf058acb924c11925e5c660e1c3b5a/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=tWDPd-5b4hzpzvJJjelfZCARBviG3gIJdTLHnXttUFg",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ oid }), // send only objectId
        }
      )
        .then((res) => res.json())
        .then((data) => {
          // Logic App response is just the phone number string
          setPhone(data);
        })
        .catch((err) => console.error("Logic App call failed", err));
    }
  }, [accounts]);

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
        <b>Phone:</b> {phone || "Not available"}</p>
    </div>
  );
}

export default UserInfo;
