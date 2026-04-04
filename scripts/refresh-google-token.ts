import { getOAuth2Client } from "@/auth";

/**
 * Google OAuth リフレッシュトークンを更新するスクリプト
 *
 * 現在のリフレッシュトークンを使ってアクセストークンを取得し、
 * Google から新しいリフレッシュトークンが発行された場合は stdout に出力する。
 * ログは stderr に出力するため、stdout には新しいリフレッシュトークンのみが出力される。
 */
const main = async () => {
  const refreshToken = process.env.YOUTUBE_DATA_API_REFRESH_TOKEN;

  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  process.stderr.write("リフレッシュトークンを使用してアクセストークンを取得します...\n");

  const { credentials } = await oauth2Client.refreshAccessToken();

  process.stderr.write("アクセストークンの取得に成功しました\n");

  const newRefreshToken = credentials.refresh_token;

  if (newRefreshToken) {
    process.stderr.write("新しいリフレッシュトークンが発行されました\n");
    process.stdout.write(newRefreshToken);
  } else {
    process.stderr.write(
      "新しいリフレッシュトークンは発行されませんでした。既存のトークンを引き続き使用してください\n",
    );
  }
};

main().catch((e) => {
  process.stderr.write(`エラー: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
