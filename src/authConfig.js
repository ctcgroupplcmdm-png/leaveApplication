export const msalConfig = {
  auth: {
    clientId: "9635bca0-a248-42ae-8537-4fd8a5b40682", // App registration ID
    authority: "https://ctcemployees.b2clogin.com/ctcemployees.onmicrosoft.com/B2C_1_Sign",
    knownAuthorities: ["ctcemployees.b2clogin.com"],
    redirectUri: "https://portal.ctcgroup.com/",
    postLogoutRedirectUri: "https://portal.ctcgroup.com/"
  }
};

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "offline_access"
    
  ]
};
