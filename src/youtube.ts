import { google, type youtube_v3 } from "googleapis";
import { authenticateWithRefreshToken } from "./auth";

export type Youtube = youtube_v3.Youtube;

/**
 * 別で作成したYoutube関連操作の権限を持つ認証のリフレッシュトークンを使って、Youtube APIをセットアップする
 */
export const setupYoutube = async (): Promise<Youtube> => {
  const oauth2Client = authenticateWithRefreshToken({ refreshToken: process.env.YOUTUBE_DATA_API_REFRESH_TOKEN });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  return youtube;
};
