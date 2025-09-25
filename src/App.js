import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import UserInfo from "./UserInfo"; // 👈 import here

function App() {
  const { instance, accounts } = useMsal();

  const login = () => instance.loginRedirect(loginRequest);
  const logout = () => instance.logoutRedirect();

  return (
    <div>
      <h1>Azure B2C + React</h1>
      {accounts.length > 0 ? (
        <>
          <UserInfo /> {/* 👈 show user info */}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default App;
