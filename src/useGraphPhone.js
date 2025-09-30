import { useMsal } from "@azure/msal-react";

export default function useGraphPhone() {
  const { instance, accounts } = useMsal();

  const getPhone = async () => {
    if (!accounts || accounts.length === 0) throw new Error("No account");

    const account = accounts[0];
    const request = {
      scopes: ["User.Read"], // must be in your loginRequest scopes too
      account: account
    };

    try {
      const resp = await instance.acquireTokenSilent(request);
      const token = resp.accessToken;

      const graphRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mobilePhone,displayName", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!graphRes.ok) throw new Error(`Graph error: ${graphRes.status}`);
      return await graphRes.json();
    } catch (err) {
      if (err.name === "InteractionRequiredAuthError") {
        await instance.acquireTokenPopup(request);
        return getPhone(); // retry after interactive
      }
      throw err;
    }
  };

  return { getPhone };
}
