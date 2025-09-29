# Supabaseセットアップガイド

このドキュメントでは、宮中サッカー部管理システムでSupabaseを使用するためのセットアップ手順を説明します。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスし、アカウントを作成またはログイン
2. 「New project」をクリック
3. プロジェクト名を入力（例：`miyachu-soccer`）
4. データベースパスワードを設定
5. リージョンを選択（日本の場合は `Northeast Asia (Tokyo)`）
6. 「Create new project」をクリック

## 2. 環境変数の設定

1. Supabaseプロジェクトのダッシュボードで「Settings」→「API」を開く
2. 以下の値をコピー：
   - `Project URL`
   - `anon public key`

3. プロジェクトルートに `.env.local` ファイルを作成：

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase/migrations/001_initial_schema.sql` の内容をコピー&ペースト
3. 「Run」をクリックしてスキーマを適用

## 4. メール認証の設定

### 開発環境（ローカル）
開発環境では、Supabaseが提供するデフォルトのメール設定を使用できます。

### 本番環境
本番環境では、独自のSMTPサーバーを設定することを推奨します：

1. Supabaseダッシュボードで「Settings」→「Auth」を開く
2. 「SMTP Settings」セクションで以下を設定：
   - Enable custom SMTP: ON
   - SMTP Host, Port, Username, Password を設定

## 5. 認証設定の調整

1. 「Settings」→「Auth」→「Providers」で以下を確認：
   - Email: 有効化
   - Confirm email: 有効化（推奨）

2. 「Settings」→「Auth」→「URL Configuration」で：
   - Site URL: `http://localhost:5173` (開発環境)
   - Redirect URLs: 必要に応じて追加

## 6. Row Level Security (RLS) の確認

スキーマ適用後、以下のテーブルでRLSが有効になっていることを確認：

- `profiles`
- `invitations`
- `players`
- `matches`
- `match_lineups`
- `substitutions`
- `player_statistics`
- `team_settings`

## 7. アプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスして、新しい認証システムが動作することを確認してください。

## トラブルシューティング

### 環境変数が読み込まれない
- `.env.local` ファイルがプロジェクトルートに配置されているか確認
- アプリケーションを再起動

### メール認証が届かない
- 迷惑メールフォルダを確認
- Supabaseの「Auth」→「Logs」でエラーを確認

### データベース接続エラー
- プロジェクトURLとAPIキーが正しいか確認
- Supabaseプロジェクトがアクティブか確認

## 既存データの移行

既存のJSONStoreデータをSupabaseに移行する機能は、次のステップで実装予定です。

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)