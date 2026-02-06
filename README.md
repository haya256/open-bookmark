# Open Bookmark

シンプルなブックマーク管理アプリ。Cloudflare Workers + D1 で動作。

## 機能

- ブックマークの追加・編集・削除
- タイトル・URLで検索
- 管理者認証（閲覧は誰でも可能、編集は管理者のみ）

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/haya256/open-bookmark.git
cd open-bookmark
npm install
```

### 2. Cloudflareにログイン

```bash
npx wrangler login
```

### 3. D1データベースを作成

```bash
npx wrangler d1 create open-bookmark-db
```

出力された `database_id` を `wrangler.toml` に設定：

```toml
[[d1_databases]]
binding = "DB"
database_name = "open-bookmark-db"
database_id = "ここに出力されたIDを貼り付け"
```

### 4. スキーマを適用

```bash
npx wrangler d1 execute open-bookmark-db --remote --file=./schema.sql
```

### 5. 管理者パスワードを設定

```bash
npx wrangler secret put AUTH_PASSWORD
```

プロンプトが表示されたら、好きなパスワードを入力。

### 6. デプロイ

```bash
npx wrangler deploy
```

## ローカル開発

```bash
npm run dev
```

## ライセンス

MIT
