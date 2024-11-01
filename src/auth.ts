import { google } from "googleapis";

export type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export const getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });

  // oauth2Client.on("tokens", (tokens) => {
  // 更新された時になんかする
  // });

  return oauth2Client;
};

export const authenticateWithRefreshToken = ({ refreshToken }: { refreshToken: string }) => {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
};
