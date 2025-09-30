import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { getUserPhone } from "./graph"; // 👈 helper for MS Graph

function UserInfo() {
  const { instance, accounts } = useMsal();
  const account = accounts[0]; // first signed-in account
  const [phone, setPhone] = useState(null);

  useEffect(() => {
    async function fetchPhone() {
      if (account) {
        const phoneNumber = await getUserPhone(instance, account);
        setPhone(phoneNumber);
      }
    }
    fetchPhone();
  }, [account, instance]);

  if (!account) return <p>Not signed in</p>;

  const claims = account.idTokenClaims;

  return (
    <div>
      <p><b>Username:</b> {account.username}</p>
      <p><b>Name:</b> {claims?.name}</p>
      <p><b>Phone:</b> {phone || "Not available"}</p>
    </div>
  );
}

export default UserInfo;
