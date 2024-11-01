# YouTube関連のあれこれを書き散らすリポジトリ

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
bun run scripts/auth.ts
```

表示されたリフレッシュトークンを`.env`に設定する

OAuth consent screenのPublishing statusをProductionにするとリフレッシュトークンの期限がほぼ無限になる

```env
YOUTUBE_DATA_API_REFRESH_TOKEN=
```
