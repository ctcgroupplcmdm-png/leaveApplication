import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import useGraphPhone from "./useGraphPhone";

function UserInfo() {
  const { accounts } = useMsal();
  const account = accounts[0];
  const { getPhone } = useGraphPhone();

  const [graphProfile, setGraphProfile] = useState(null);

  useEffect(() => {
    if (account) {
      getPhone().then(setGraphProfile).catch(console.error);
    }
  }, [account, getPhone]);

  if (!account) return <p>Not signed in</p>;

  return (
    <div>
      <p><b>Username:</b> {account.username}</p>
      <p><b>Name:</b> {graphProfile?.displayName || account.name}</p>
      <p><b>Phone:</b> {graphProfile?.mobilePhone || "Not available"}</p>
    </div>
  );
}

export default UserInfo;
