import { useMsal } from "@azure/msal-react";

function UserInfo() {
  const { accounts } = useMsal();
  const account = accounts[0]; // First logged-in account

  if (!account) return <p>Not signed in</p>;

  return (
    <div>
      <p><b>Username:</b> {account.username}</p>
      <p><b>Name:</b> {account.name}</p>
    </div>
  );
}

export default UserInfo;
