export async function getUserPhone(msalInstance, account) {
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["https://graph.microsoft.com/User.Read"],
      account
    });

    const token = response.accessToken;
    const objectId = account.idTokenClaims?.oid;

    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${objectId}?$select=identities`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!graphResponse.ok) {
      throw new Error(`Graph error: ${graphResponse.status}`);
    }

    const data = await graphResponse.json();

    const phoneIdentity = data.identities?.find(
      (id) => id.signInType === "phoneNumber"
    );

    return phoneIdentity?.issuerAssignedId || null;
  } catch (err) {
    console.error("Graph call failed", err);
    return null;
  }
}
