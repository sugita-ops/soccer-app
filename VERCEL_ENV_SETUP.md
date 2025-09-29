# Vercel環境変数設定ガイド

## 必要な環境変数

### 1. VITE_SUPABASE_URL
- **形式**: `https://your-project-id.supabase.co`
- **取得方法**: Supabase Dashboard → Settings → API → Project URL
- **例**: `https://abcdefghijklmnop.supabase.co`

### 2. VITE_SUPABASE_ANON_KEY
- **形式**: 長い英数字文字列（eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...）
- **取得方法**: Supabase Dashboard → Settings → API → anon public key
- **注意**: publicキーなので秘匿性は不要

## Vercelでの設定手順

### 方法1: Vercelダッシュボード（推奨）
1. https://vercel.com/dashboard → soccer-app-v2
2. Settings → Environment Variables
3. Add New:
   - Name: `VITE_SUPABASE_URL`
   - Value: [あなたのSupabase URL]
   - Environments: ☑️ Production
4. Add New:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: [あなたのSupabase Anon Key]
   - Environments: ☑️ Production
5. Save → 自動再デプロイ開始

### 方法2: Vercel CLI（認証後）
```bash
vercel login
vercel env add VITE_SUPABASE_URL production --project soccer-app-v2
vercel env add VITE_SUPABASE_ANON_KEY production --project soccer-app-v2
```

## 設定後の確認

### 自動再デプロイの監視
- 環境変数設定後、数分でVercelが自動再デプロイを開始
- GitHub Deployments APIで進捗確認可能

### 動作確認ポイント
- https://soccer-app-v2.vercel.app でログイン画面が表示される
- "メールアドレスでサインアップ" ボタンの出現
- Supabase認証フローの動作

## トラブルシューティング
- 設定後もJSONStore機能で動作する場合: Build Cacheを無効にして手動Redeploy
- 環境変数が反映されない場合: Production環境に設定されているか確認
- 認証エラーの場合: Supabase RLS設定の確認