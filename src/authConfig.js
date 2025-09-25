export const msalConfig = {
  auth: {
    clientId: "9635bca0-a248-42ae-8537-4fd8a5b40682", // App registration ID
    authority: "https://ctcemployees.b2clogin.com/ctcemployees.onmicrosoft.com/B2C_1_Sign",
    knownAuthorities: ["https://ctcemployees.b2clogin.com"],
    redirectUri: "https://white-field-0d7086703.2.azurestaticapps.net/",
    postLogoutRedirectUri: "https://white-field-0d7086703.2.azurestaticapps.net/"
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "offline_access"]
};
