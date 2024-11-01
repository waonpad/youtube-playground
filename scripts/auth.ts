import { createServer } from "node:http";
import { type OAuth2ClientType, getOAuth2Client } from "@/auth";
import open from "open";
import enableDestroy from "server-destroy";

/**
 * 最初の認証を行うための関数
 *
 * ブラウザを開く必要があるため、ローカルでの実行に限られる
 */
export const authenticate = async ({ scope }: { scope: string[] }) => {
  // 認証クライアントを作成
  const oauth2Client = getOAuth2Client();

  // 認証URLを生成
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope,
  });

  // 認証後のコールバックURLを開くためのサーバーを作成
  const server = createServer();

  // サーバーが起動したら認証URLを開くよう設定
  server.on("listening", async () => {
    const pros = await open(authorizeUrl);

    pros.unref();
  });

  const authenticatedOauth2Client = await new Promise<OAuth2ClientType>((resolve, reject) => {
    // サーバーにリクエストがあったらトークンを取得するリスナーを登録
    // 初回りクエスト後、サーバーを停止する
    server.on("request", async (req, res) => {
      try {
        res.end("認証が完了しました。この画面を閉じてください。");
        server.destroy();

        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const qs = new URL(req.url!, "http://localhost:3000").searchParams;

        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const code = qs.get("code")!;

        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        resolve(oauth2Client);
      } catch (e) {
        server.destroy();
        reject(e);
      }
    });

    // サーバーを起動
    server.listen(3000);

    // サーバーを完全に停止するために必要
    enableDestroy(server);
  });

  return authenticatedOauth2Client;
};

const authScopes = {
  youtube: [
    "https://www.googleapis.com/auth/youtube", //	YouTube アカウントの管理
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator", //	現在アクティブなチャンネル メンバー、メンバーの現在のレベル、いつメンバーになったかをリストで確認する
    "https://www.googleapis.com/auth/youtube.force-ssl", //	YouTube 動画、評価、コメント、字幕の表示、編集、完全削除
    "https://www.googleapis.com/auth/youtube.readonly", // YouTube アカウントの表示
    "https://www.googleapis.com/auth/youtube.upload", // YouTube 動画の管理
    "https://www.googleapis.com/auth/youtubepartner", // YouTube のアセットや関連するコンテンツの表示と管理
    "https://www.googleapis.com/auth/youtubepartner-channel-audit", // YouTube パートナーの監査プロセス時に関連する YouTube チャンネルの個人情報の表示
  ] as const satisfies string[],
};

const main = async () => {
  // コマンドライン引数からどのスコープで認証するかを取得
  const scope = process.argv[2] as keyof typeof authScopes;

  if (!scope) {
    console.error("スコープを指定してください。");
    return;
  }

  const oauth2Client = await authenticate({ scope: authScopes[scope] });

  console.log(oauth2Client.credentials);
};

main();
