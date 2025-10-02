export const msalConfig = {
  auth: {
    clientId: "0ad1f969-a1d5-477b-9519-794fc056f122", // App registration ID
    authority: "https://ctcemployees.b2clogin.com/ctcemployees.onmicrosoft.com/B2C_1_Sign",
    knownAuthorities: ["ctcemployees.b2clogin.com"],
    redirectUri: "https://zealous-meadow-05ff82703.2.azurestaticapps.net/",
    postLogoutRedirectUri: "https://zealous-meadow-05ff82703.2.azurestaticapps.net/"
  }
};

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "offline_access",
    "https://graph.microsoft.com/User.ReadBasic.All"
  ]
};
