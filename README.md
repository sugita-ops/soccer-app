# ⚽ 宮中サッカー部 管理システム

チーム管理とクラウド同期機能を備えたサッカー部管理アプリケーションです。

## 🚀 機能

### 基本機能
- 👥 選手登録・管理
- 📝 試合記録（フォーメーション、スコア、交代履歴）
- 📷 写真・動画管理（Base64保存、YouTube連携）
- 💬 応援コメント機能
- 🔐 ユーザー認証・権限管理

### 🌐 クラウド同期機能
- ☁️ **GitHub Gistベースのクラウドストレージ**
- 🔄 **自動同期** - アプリ起動時に自動でクラウドから最新データを取得
- 🔐 **パスワード保護** - クラウド保存時の認証機能
- 📱 **複数デバイス対応** - 異なるデバイス間でのデータ共有
- 🔔 **リアルタイム通知** - 操作結果をトースト通知で表示

## 📁 ファイル構成

```
src/
├── App.jsx              # メインアプリコンポーネント
├── components/
│   ├── Toast.jsx        # トースト通知システム
│   └── PlayerImport.jsx # 選手データインポート
├── lib/
│   ├── jsonStore.js     # ローカルストレージ管理
│   └── cloudSync.js     # クラウド同期機能
├── ui.js               # UI スタイル定義
└── main.jsx            # エントリーポイント

api/
└── players.js          # Vercel Serverless Function

public/
└── img/
    └── miyachu-header.png
```

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. クラウド同期機能の設定（任意）

クラウド同期を利用する場合は、以下の手順に従ってください：

#### 2.1 GitHub Personal Access Tokenの作成

1. [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) にアクセス
2. "Generate new token (classic)" をクリック
3. 以下の設定で作成：
   - **Note**: `soccer-app-gist-access`
   - **Expiration**: お好みの期間
   - **Scopes**: `gist` のみチェック
4. 生成されたトークンをコピー（後で使用）

#### 2.2 GitHub Gistの作成

1. [https://gist.github.com/](https://gist.github.com/) にアクセス
2. 新しいGistを作成：
   - **Filename**: `players.json`
   - **Content**: `{"players":[],"version":1}`
   - **Visibility**: Private（推奨）
3. Gistを作成後、URLからGist IDをコピー
   - 例：`https://gist.github.com/username/1234567890abcdef` → ID: `1234567890abcdef`

#### 2.3 環境変数の設定

1. `.env.example` をコピーして `.env` ファイルを作成：
```bash
cp .env.example .env
```

2. `.env` ファイルを編集：
```env
GITHUB_TOKEN=ghp_あなたのトークン
GIST_ID=あなたのGistID
WRITE_PASSWORD=お好みのパスワード
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## 📚 使用方法

### ローカル使用（クラウド同期なし）
- 環境変数を設定せずにそのまま使用可能
- データはブラウザのローカルストレージに保存

### クラウド同期使用
1. アプリ起動時に自動でクラウドからデータを同期
2. 選手管理画面で「☁️ クラウド保存」ボタンからデータをクラウドに保存
3. ヘッダーの「☁️ クラウド読込」ボタンで手動同期

## 🔧 Vercelでのデプロイ

### 1. Vercelプロジェクトの作成

```bash
npm i -g vercel
vercel login
vercel
```

### 2. 環境変数の設定

Vercelダッシュボードで以下を設定：
- `GITHUB_TOKEN`
- `GIST_ID`
- `WRITE_PASSWORD`

### 3. デプロイ

```bash
vercel --prod
```

## 🔗 API エンドポイント

### GET /api/players
- **説明**: 選手データの取得（認証不要）
- **レスポンス**:
```json
{
  "success": true,
  "data": {
    "players": [...],
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "version": 1
  }
}
```

### POST /api/players
- **説明**: 選手データの保存（認証必要）
- **認証**: Bearerトークンまたはボディ内password
- **リクエスト**:
```json
{
  "players": [...],
  "password": "your_password"
}
```

## 🔒 認証とセキュリティ

- **フロントエンド**: ID/パスワードベースの権限管理
- **API**: 環境変数で設定されたパスワードによる書き込み保護
- **データ暗号化**: GitHub Gistのプライベート設定により保護

## 🎨 カスタマイズ

### UIテーマの変更
`src/ui.js` でカラーパレットとスタイルを変更可能

### デフォルトフォーメーションの追加
`src/App.jsx` の `FORMATIONS` オブジェクトに新しいフォーメーションを追加

## 🐛 トラブルシューティング

### クラウド同期が動作しない
1. 環境変数が正しく設定されているか確認
2. GitHub tokenの権限（gist）を確認
3. Gist IDが正しいか確認
4. ネットワーク接続を確認

### 選手データが表示されない
1. ブラウザのローカルストレージを確認
2. JSONファイルの形式が正しいか確認
3. アプリを再読み込み

## 📄 ライセンス

MIT License

## 🤝 貢献

プルリクエストやIssueでの改善提案を歓迎します。

---

**開発者**: Claude Code 🤖