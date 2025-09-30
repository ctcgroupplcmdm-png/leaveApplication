import { useMsal } from "@azure/msal-react";

function UserInfo() {
  const { accounts } = useMsal();
  const account = accounts[0]; // First logged-in account

  if (!account) return <p>Not signed in</p>;

  const claims = account.idTokenClaims; // 👈 all the claims from token

  return (
    <div>
      <p><b>Username:</b> {account.username}</p>
      <p><b>Name:</b> {claims?.name}</p>
      <p><b>Phone:</b> {claims?.phone_number || "Not available"}</p>
    </div>
  );
}

export default UserInfo;
