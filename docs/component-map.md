# コンポーネント構成図

## ディレクトリ構造

```
soccer-app/
├── public/
│   └── img/
│       └── pitch-lines.svg          # ピッチライン画像
├── src/
│   ├── components/
│   │   ├── FormationPitch.jsx       # フォーメーション視覚化
│   │   ├── GoalRecordingModal.jsx   # 得点記録モーダル
│   │   ├── GoalTimeline.jsx         # 得点タイムライン表示
│   │   ├── PlayerStatistics.jsx     # 選手統計表示
│   │   ├── StadiumVisionDisplay.jsx # スタジアムビジョン表示
│   │   └── Sections/
│   │       ├── MatchSection.jsx     # 試合記録（最重要）
│   │       ├── HistorySection.jsx   # 試合履歴
│   │       ├── PlayerSection.jsx    # 選手管理
│   │       └── SettingsSection.jsx  # チーム設定
│   ├── lib/
│   │   └── formations.ts            # フォーメーション定義
│   ├── App.jsx                      # メインアプリ
│   ├── index.css                    # グローバルスタイル
│   └── main.jsx                     # エントリーポイント
├── docs/                            # ドキュメント
│   ├── data-structures.md
│   ├── key-implementations.md
│   └── component-map.md (このファイル)
├── DEVELOPMENT_MEMORY.md            # 開発メモリー
├── package.json
├── vite.config.js
└── vercel.json
```

---

## コンポーネント関係図

```
App.jsx
├── PlayerSection.jsx
│   └── (選手一覧テーブル)
│
├── MatchSection.jsx  ★最重要
│   ├── FormationPitch.jsx
│   │   └── (ピッチ視覚化)
│   ├── GoalRecordingModal.jsx
│   │   └── (得点記録フォーム)
│   └── GoalTimeline.jsx
│       └── (得点タイムライン)
│
├── HistorySection.jsx
│   └── (試合一覧)
│
├── PlayerStatistics.jsx
│   └── (統計テーブル)
│
├── SettingsSection.jsx
│   └── (ユニフォーム設定)
│
└── StadiumVisionDisplay.jsx
    └── (フルスクリーン表示)
```

---

## 各コンポーネント詳細

### `App.jsx`
**役割**: アプリケーション全体の状態管理と画面切り替え

**主要な状態**:
```javascript
const [players, setPlayers] = useState([])      // 選手リスト
const [matches, setMatches] = useState([])      // 試合リスト
const [currentMatch, setCurrentMatch] = useState(emptyMatch())
const [activeTab, setActiveTab] = useState('match')  // タブ切り替え
const [visionMatch, setVisionMatch] = useState(null) // ビジョン表示用
const [uniforms, setUniforms] = useState(defaultUniforms)
```

**データフロー**:
- localStorage ⇔ State
- Supabase ⇔ State（統計のみ）

---

### `PlayerSection.jsx`
**役割**: 選手の登録・編集・削除

**Props**:
```javascript
{
  players: Player[],
  setPlayers: (players: Player[]) => void
}
```

**主要機能**:
- 選手追加フォーム
- 選手一覧テーブル
- 編集・削除ボタン

**重要な関数**:
- `addPlayer()`: 選手追加
- `deletePlayer(id)`: 選手削除
- `editPlayer(player)`: 選手編集

---

### `MatchSection.jsx` ★最重要
**役割**: 試合記録のメイン画面

**Props**:
```javascript
{
  players: Player[],
  match: Match,
  setMatch: (match: Match) => void,
  saveMatch: () => void,
  teamId: string,
  uniforms: Uniforms
}
```

**主要機能**:
1. 基本情報入力（日時、対戦相手、会場、スコア）
2. 11人制/8人制切り替え
3. フォーメーション選択
4. スターティングメンバー選択
5. 得点・アシスト記録
6. 交代履歴
7. 写真アップロード
8. YouTube動画リンク
9. 複数試合記録

**子コンポーネント**:
- `FormationPitch`: ピッチ視覚化
- `GoalRecordingModal`: 得点記録モーダル
- `GoalTimeline`: 得点タイムライン

**重要な状態**:
```javascript
const [showGoalModal, setShowGoalModal] = useState(false)
const [editingGoal, setEditingGoal] = useState(null)
const [newPhoto, setNewPhoto] = useState("")
const [newSubstitution, setNewSubstitution] = useState({...})
```

**重要な関数**:
- `getCurrentFormations()`: 人数に応じたフォーメーション取得
- `changeFormation(newFormation)`: フォーメーション変更
- `changePlayerCount(newCount)`: 人数切り替え
- `saveGoal(goal)`: 得点保存
- `deleteGoal(goalId)`: 得点削除

**ファイル位置**: `src/components/Sections/MatchSection.jsx`

---

### `FormationPitch.jsx`
**役割**: ピッチ上でのフォーメーション視覚化

**Props**:
```javascript
{
  formation: FormationKey,
  players: (Player | null)[],  // 配列の順序がポジションに対応
  teamUniforms: Uniforms,
  useAway: boolean
}
```

**レンダリング**:
```
ピッチ画像（pitch-lines.svg）
  └── 各選手のユニフォームアイコン
      ├── 背番号
      └── 名前
```

**座標計算**:
- `formations.ts`の座標を使用
- x, y を %単位でposition指定

---

### `GoalRecordingModal.jsx`
**役割**: 得点記録の入力モーダル

**Props**:
```javascript
{
  players: Player[],
  onSave: (goal: Goal) => void,
  onClose: () => void,
  existingGoal: Goal | null  // 編集時に使用
}
```

**入力項目**:
1. 時間（分）
2. 得点者（セレクトボックス）
3. アシスト者（セレクトボックス、任意）
4. 「アシストなし」チェックボックス

**重要なロジック**:
- `useEffect`でexistingGoal変更時に状態リセット
- バリデーション: 時間と得点者は必須

---

### `GoalTimeline.jsx`
**役割**: 得点のタイムライン表示

**Props**:
```javascript
{
  goals: Goal[],
  players: Player[],
  onEdit: (goal: Goal) => void,
  onDelete: (goalId: string) => void,
  readonly: boolean  // 編集・削除ボタンの表示制御
}
```

**表示パターン**:
- **モバイル**: 縦スクロールカード
- **デスクトップ**: 横長タイムライン

**レスポンシブ判定**:
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

---

### `HistorySection.jsx`
**役割**: 試合履歴の一覧と統計表示

**Props**:
```javascript
{
  matches: Match[],
  players: Player[],
  setVisionMatch: (match: Match) => void
}
```

**主要機能**:
1. 統計ダッシュボード（総試合数、勝敗、勝率、得失点）
2. フィルター（試合種別）
3. ソート（日付、対戦相手、得失点差）
4. 試合詳細表示
5. ビジョン表示ボタン
6. データエクスポート（JSON）

**重要な関数**:
- `getMatchResult(match)`: 試合結果を算出
- `exportMatches()`: JSON書き出し

---

### `PlayerStatistics.jsx`
**役割**: 選手別の統計表示

**Props**:
```javascript
{
  players: Player[],
  matches: Match[],
  teamId: string
}
```

**表示項目**:
- 出場数
- 得点数
- アシスト数

**データソース**:
1. Supabase統計（優先）
2. ローカル試合データから集計（フォールバック）

**集計ロジック**:
```javascript
const playerSummaries = useMemo(() => {
  // Supabaseデータ + ローカルデータをマージ
}, [statistics, matches, players]);
```

---

### `SettingsSection.jsx`
**役割**: チーム設定（ユニフォームカラー）

**Props**:
```javascript
{
  uniforms: Uniforms,
  setUniforms: (uniforms: Uniforms) => void
}
```

**設定項目**:
- ホームユニフォームカラー
- アウェイユニフォームカラー

**データ構造**:
```javascript
{
  home: { primary: "#color", secondary: "#color" },
  away: { primary: "#color", secondary: "#color" }
}
```

---

### `StadiumVisionDisplay.jsx`
**役割**: スタジアム風フルスクリーン表示

**Props**:
```javascript
{
  match: Match,
  players: Player[],
  onClose: () => void
}
```

**表示内容**:
1. ヘッダー（チーム名、リアルタイム時計、閉じるボタン）
2. スコアカード
3. 得点者リスト
4. MVP表示
5. チーム情報
6. スターティングメンバー（ポジション簡略表示）
7. 交代情報

**演出**:
- CSS 3D効果（perspective, rotateX）
- 観客席シルエット
- スポットライト効果
- ダークテーマ

**重要な関数**:
- `getPlayerInfo(playerId)`: 選手情報取得
- `getPositionCategory(position)`: ポジション簡略化
- `getFormationPositions(formation)`: フォーメーションのポジションリスト取得

---

## データフロー詳細

### 選手データの流れ
```
PlayerSection (入力)
  ↓
App.jsx (setPlayers)
  ↓
localStorage保存
  ↓
他のコンポーネントで参照
  ├→ MatchSection (選手選択)
  ├→ HistorySection (表示)
  ├→ PlayerStatistics (統計)
  └→ StadiumVisionDisplay (表示)
```

### 試合データの流れ
```
MatchSection (入力)
  ↓
App.jsx (setCurrentMatch)
  ↓
saveMatch()
  ↓
matches配列に追加
  ↓
localStorage保存
  ↓
他のコンポーネントで参照
  ├→ HistorySection (一覧表示)
  ├→ PlayerStatistics (統計計算)
  └→ StadiumVisionDisplay (ビジョン表示)
```

### 得点データの流れ（特殊）
```
GoalRecordingModal (入力)
  ↓
MatchSection.saveGoal()
  ↓
match.goals配列に追加
  ↓
match.goalsFor自動計算
  ↓
GoalTimeline (表示)
```

---

## 状態管理の全体像

### App.jsxの状態
```javascript
// 永続データ
players        // localStorage: soccer_players_default
matches        // localStorage: soccer_matches_default
uniforms       // localStorage: soccer_team_default

// 一時的な状態
currentMatch   // 現在編集中の試合
activeTab      // 現在のタブ
visionMatch    // ビジョン表示中の試合
```

### 各Sectionの状態
```javascript
// MatchSection
showGoalModal, editingGoal, newPhoto, newSubstitution, ...

// HistorySection
filterType, sortBy

// PlayerSection
editingPlayer, newPlayer

// PlayerStatistics
statistics (Supabaseから取得)
```

---

## イベントフロー

### 試合記録の保存
```
1. ユーザーが「試合を保存」クリック
   ↓
2. MatchSection.handleSaveMatch()
   ↓
3. バリデーション（GK必須チェック）
   ↓
4. App.jsx.saveMatch()
   ↓
5. matches配列に追加
   ↓
6. localStorage保存
   ↓
7. currentMatchをリセット
```

### 得点記録の追加
```
1. ユーザーが「+ 得点を追加」クリック
   ↓
2. MatchSection.openGoalModal()
   ↓
3. GoalRecordingModalが表示
   ↓
4. ユーザーが入力して「追加」クリック
   ↓
5. GoalRecordingModal.handleSave()
   ↓
6. バリデーション
   ↓
7. MatchSection.saveGoal(goal)
   ↓
8. match.goalsに追加 & goalsFor自動計算
   ↓
9. GoalTimeline更新
```

### ビジョン表示
```
1. HistorySection で「ビジョン表示」クリック
   ↓
2. App.jsx.setVisionMatch(match)
   ↓
3. StadiumVisionDisplayがマウント
   ↓
4. フルスクリーンで表示
   ↓
5. 「閉じる」クリック
   ↓
6. App.jsx.setVisionMatch(null)
   ↓
7. アンマウント
```

---

## 依存関係

### コンポーネント間の依存
```
App.jsx
  ├─ depends on ─→ emptyMatch (from MatchSection)
  ├─ depends on ─→ defaultUniforms (from SettingsSection)
  └─ depends on ─→ すべての Section コンポーネント

MatchSection
  ├─ depends on ─→ FormationPitch
  ├─ depends on ─→ GoalRecordingModal
  ├─ depends on ─→ GoalTimeline
  └─ depends on ─→ formationMap (from lib/formations.ts)

HistorySection
  ├─ depends on ─→ FORMATIONS_11, FORMATIONS_8 (from MatchSection)
  └─ ALL_FORMATIONSを生成

StadiumVisionDisplay
  └─ depends on ─→ 独自のgetFormationPositions()
```

---

## まとめ

このコンポーネント構成は、以下の設計原則に基づいています：

1. **単一責任**: 各コンポーネントは明確な役割を持つ
2. **データフロー**: Appから子へPropsで渡す（単方向）
3. **状態管理**: Appで集中管理、各Sectionは一時的な状態のみ
4. **再利用性**: FormationPitch, GoalTimeline等は汎用的に設計

開発再開時には、この構成図を参照して、
どのコンポーネントがどの責任を持っているかを把握してください。
