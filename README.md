# YouTube関連のあれこれを書き散らすリポジトリ

## ディレクトリ構成

- `src`: 機能毎に分けた、再利用を目的としたコードを置く
- `scripts`: ファイルを実行する事で何らかの具体的な目的を果たすスクリプトを置く

## セットアップ

```bash
bun run setup
```

### 環境変数の設定

1. https://console.cloud.google.com/apis/credentials にアクセスしていろいろ設定する
1. `.env`に設定する

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### アクセストークンの取得

スクリプトを実行するとブラウザが開いて、認証を行うとアクセストークンが出力される

```bash
bun run scripts/auth-on-browser.ts
```

表示されたリフレッシュトークンを`.env`に設定する

OAuth consent screenのPublishing statusをProductionにするとリフレッシュトークンの期限がほぼ無限になる

```env
YOUTUBE_DATA_API_REFRESH_TOKEN=
```

> 更新トークンは、次のいずれかの理由で付与後に機能しなくなる場合があります。
> - ユーザーがアプリのアクセスを取り消しました
> - リフレッシュトークンが6か月間使用されていない
> - ユーザーがパスワードを変更し、リフレッシュトークンにGmailスコープが含まれている
> - ユーザー アカウントがライブ更新トークンの最大数を超えました
> - アプリケーションのステータスが「テスト中」であり、同意画面が外部ユーザータイプ用に設定されているため、トークンは 7 日後に期限切れになります。
>
> [googleapis/google-api-nodejs-client](https://github.com/googleapis/google-api-nodejs-client?tab=readme-ov-file#handling-refresh-tokens)
