export const msalConfig = {
  auth: {
    clientId: "9635bca0-a248-42ae-8537-4fd8a5b40682", // App registration ID
    authority: "https://ctcemployees.b2clogin.com/ctcemployees.onmicrosoft.com.onmicrosoft.com/B2C_1_Sign",
    knownAuthorities: ["https://ctcemployees.b2clogin.com"],
    redirectUri: "http://localhost:3000",
    postLogoutRedirectUri: "http://localhost:3000"
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "offline_access"]
};
