# YouTube関連のあれこれを書き散らすリポジトリ

## ディレクトリ構成

- `src`: 機能毎に分けた、再利用を目的としたコードを置く
- `scripts`: ファイルを実行する事で何らかの具体的な目的を果たすスクリプトを置く

## セットアップ

```bash
bun run setup
```

### 環境変数を設定する

1. https://console.cloud.google.com/apis/credentials にアクセスしていろいろ設定する
1. `.env`に設定する

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### アクセストークンを取得する

スクリプトを実行するとブラウザが開いて、認証を行うとアクセストークンが出力される

```bash
bun run scripts/auth-on-browser.ts youtube
```

表示されたリフレッシュトークンを`.env`に設定する

```env
YOUTUBE_DATA_API_REFRESH_TOKEN=
```

[OAuth consent screenのPublishing statusをProductionにする](https://console.cloud.google.com/auth/audience)とリフレッシュトークンの期限がほぼ無限になるが、手続きが面倒なので推奨しない

[statusがTestingのままだとリフレッシュトークンは7日で期限切れになる](https://github.com/googleapis/google-api-nodejs-client?tab=readme-ov-file#handling-refresh-tokens)
