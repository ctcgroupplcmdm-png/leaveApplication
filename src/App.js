import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

function App() {
  const { instance, accounts } = useMsal();

  const login = () => {
    instance.loginRedirect(loginRequest).catch(err => console.error(err));
  };

  const logout = () => {
    instance.logoutRedirect();
  };

  return (
    <div>
      <h1>Azure B2C + React</h1>
      {accounts.length > 0 ? (
        <>
          <p>Signed in as: {accounts[0].username}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default App;
