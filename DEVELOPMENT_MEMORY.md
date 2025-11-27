# 開発メモリー - サッカー部管理アプリ

**最終更新**: 2025年（8人制対応完了時点）

## 🎯 プロジェクト概要

### 目的
宮中サッカー部の試合記録・選手管理を効率化するWebアプリケーション

### 技術スタック
- **フロントエンド**: React 18 + Vite
- **バックエンド**: Supabase (PostgreSQL)
- **デプロイ**: Vercel
- **ストレージ**: localStorage + Supabase
- **スタイリング**: インラインスタイル + CSS

### リポジトリ
- GitHub: `sugita-ops/soccer-app`
- デプロイURL: Vercel自動デプロイ

---

## 📊 データ構造

### 選手データ (Player)
```javascript
{
  id: "uuid",
  name: "string",
  number: "number",
  position: "GK|DF|MF|FW",
  grade: "string"
}
```

### 試合データ (Match)
```javascript
{
  id: "uuid",
  date: "datetime-local string",
  type: "練習試合|公式戦|招待/カップ戦",
  opponent: "string",
  venue: "string",
  playerCount: 11 | 8,           // 重要: 人数選択
  formation: "string",            // 例: "4-4-2" or "2-3-2"
  lineup: {                       // ポジション → 選手ID
    "GK": "player-id",
    "LCB": "player-id",
    // ...
  },
  goalsFor: "string",             // 自動計算（goals配列の長さ）
  goalsAgainst: "string",
  goals: [                        // 得点詳細記録
    {
      id: "uuid",
      minute: number,
      scorer: "player-id",
      assist: "player-id" | null
    }
  ],
  substitutions: [
    {
      id: "uuid",
      minute: number,
      out: "player-id",
      in: "player-id",
      reason: "string"
    }
  ],
  photos: ["url or base64"],
  youtubeUrl: "string",
  mvp: "string",
  notes: "string",
  isMultiMatch: boolean,
  subMatches: [...]               // 複数試合記録用
}
```

詳細: → `docs/data-structures.md`

---

## 🏗️ ファイル構成

```
src/
├── components/
│   ├── FormationPitch.jsx           # ピッチ視覚化
│   ├── GoalRecordingModal.jsx       # 得点記録モーダル
│   ├── GoalTimeline.jsx             # 得点タイムライン表示
│   ├── PlayerStatistics.jsx         # 選手統計
│   ├── StadiumVisionDisplay.jsx     # スタジアム風表示
│   └── Sections/
│       ├── MatchSection.jsx         # 試合記録メイン（重要）
│       ├── HistorySection.jsx       # 試合履歴
│       ├── PlayerSection.jsx        # 選手管理
│       └── SettingsSection.jsx      # チーム設定
├── lib/
│   └── formations.ts                # フォーメーション座標定義
└── App.jsx                          # メインアプリ
```

詳細: → `docs/component-map.md`

---

## ✨ 実装済み機能

### 1. 選手管理
- **ファイル**: `PlayerSection.jsx`
- 選手の追加・編集・削除
- 背番号、ポジション、学年管理

### 2. 試合記録（最重要）
- **ファイル**: `MatchSection.jsx`
- **主要機能**:
  - ✅ 11人制/8人制切り替え（ラジオボタン）
  - ✅ フォーメーション選択（人数に応じて動的変更）
  - ✅ 得点・アシスト詳細記録（モーダル）
  - ✅ 得点数の自動計算
  - ✅ 交代履歴
  - ✅ 写真アップロード（D&D、カメラ）
  - ✅ YouTube動画リンク

**重要な実装ポイント**:
```javascript
// 11人制と8人制のフォーメーション定義
const FORMATIONS_11 = {
  "4-4-2": [...],
  "4-3-3": [...],
  // ...
};

const FORMATIONS_8 = {
  "2-3-2": [...],
  "3-2-2": [...],
  "2-4-1": [...],
  "3-3-1": [...]
};

// 人数に応じてフォーメーションを取得
const getCurrentFormations = () => {
  return match.playerCount === 8 ? FORMATIONS_8 : FORMATIONS_11;
};
```

### 3. ビジョン表示（スタジアム演出）
- **ファイル**: `StadiumVisionDisplay.jsx`
- CSS 3D効果（perspective, rotateX）
- 観客席シルエット（repeating-linear-gradient）
- スポットライト効果
- リアルタイム時計

**重要な実装**:
- ポジション簡略表示: `getPositionCategory()`
  - LCB, RCB, LB... → DF
  - LM, CM, CDM... → MF
  - ST, ST1, ST2... → FW

### 4. 試合履歴
- **ファイル**: `HistorySection.jsx`
- フィルター・ソート機能
- 統計ダッシュボード（勝敗、勝率、得失点）
- データエクスポート（JSON）

### 5. 統計機能
- **ファイル**: `PlayerStatistics.jsx`
- Supabase連携での集計
- ローカルデータからの自動集計
- 得点・アシスト数の表示

### 6. チーム設定
- **ファイル**: `SettingsSection.jsx`
- ユニフォームカラー設定（ホーム/アウェイ）

---

## 🔧 重要な実装の詳細

### フォーメーション座標マッピング
**ファイル**: `lib/formations.ts`

```typescript
export type FormationKey =
  '4-4-2' | '4-2-3-1' | '4-3-3' | '3-5-2' | '5-3-2' | '3-4-2-1' |  // 11人制
  '2-3-2' | '3-2-2' | '2-4-1' | '3-3-1';                           // 8人制

export const formationMap: Record<FormationKey,
  { x: number; y: number; role: 'GK'|'DF'|'MF'|'FW' }[]> = {
  // 各フォーメーションの座標定義
};
```

### ポジションカテゴリ化ロジック
**複数ファイルで使用**: `MatchSection.jsx`, `StadiumVisionDisplay.jsx`

```javascript
const getPositionCategory = (position) => {
  if (position === 'GK') return 'GK';
  if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DF';
  if (['LM', 'LCM', 'CM', 'CDM', 'CDM1', 'CDM2', 'RCM', 'RM', 'LAM', 'CAM', 'RAM'].includes(position)) return 'MF';
  if (['LW', 'ST', 'ST1', 'ST2', 'RW'].includes(position)) return 'FW';
  return position;
};
```

### 得点自動計算の仕組み
**ファイル**: `MatchSection.jsx` (185-217行目)

```javascript
const saveGoal = (goal) => {
  setMatch(m => {
    let newGoals;
    if (editingGoal) {
      newGoals = m.goals.map(g => g.id === goal.id ? goal : g);
    } else {
      newGoals = [...(m.goals || []), goal];
    }
    return {
      ...m,
      goals: newGoals,
      goalsFor: String(newGoals.length)  // 自動計算
    };
  });
  closeGoalModal();
};
```

詳細: → `docs/key-implementations.md`

---

## 🎨 デザインの重要ポイント

### スタジアムビジョン演出
**3D効果**:
```css
perspective: 1000px
transform: rotateX(2deg)
transformStyle: preserve-3d
```

**観客席シルエット**:
```css
repeating-linear-gradient(90deg,
  rgba(255,255,255,0.03) 0px,
  rgba(255,255,255,0.03) 3px,
  transparent 3px,
  transparent 8px
)
```

### レスポンシブ対応
- モバイル: 縦スクロールカード表示
- デスクトップ: 横長タイムライン表示
- ブレークポイント: 768px

---

## 🐛 既知の問題・注意点

### 1. フォーメーション切り替え時の注意
- 人数を切り替えるとlineupがリセットされる（仕様）
- `changePlayerCount()`関数で意図的にクリア

### 2. エクスポート構造の変更
- 以前: `export { FORMATIONS }`
- 現在: `export { FORMATIONS_11, FORMATIONS_8 }`
- `HistorySection.jsx`で統合: `ALL_FORMATIONS = {...FORMATIONS_11, ...FORMATIONS_8}`

### 3. モーダル状態管理
- `GoalRecordingModal.jsx`で`useEffect`によるリセットが重要
- `existingGoal`が変わるたびに状態をリセット

### 4. デフォルト値の扱い
- 既存試合データに`playerCount`がない場合は11人制とみなす
- `match.playerCount === 11 || !match.playerCount`で判定

---

## 📋 未実装機能リスト

### 優先度: 高
- [ ] PWA対応（オフライン動作、ホーム画面追加）
- [ ] データインポート機能
- [ ] 印刷レイアウト最適化

### 優先度: 中
- [ ] 外部API連携（BAND/LINE通知）
- [ ] マルチチーム対応
- [ ] 選手詳細統計（試合ごとの成績推移グラフ）

### 優先度: 低
- [ ] ダークモード
- [ ] 多言語対応
- [ ] データバックアップ機能

---

## 🔄 開発履歴（重要な変更のみ）

### Phase 1: 基本機能実装
- 選手管理、試合記録、履歴表示

### Phase 2: ピッチ視覚化
- FormationPitch実装
- ユニフォームカラー反映

### Phase 3: 得点記録システム
- GoalRecordingModal, GoalTimeline追加
- 得点自動計算機能

### Phase 4: ビジョン表示
- StadiumVisionDisplay実装
- CSS 3D効果追加

### Phase 5: ポジション簡略化
- 全ポジション表示をGK/DF/MF/FWに統一
- `getPositionCategory()`関数追加

### Phase 6: 8人制対応（最新）
- `playerCount`フィールド追加
- FORMATIONS_8定義
- formations.tsに8人制座標追加
- 全画面で8人制対応

---

## 🚀 開発再開時のチェックリスト

### 環境確認
```bash
cd ~/soccer-app
npm run dev
```

### 主要ファイルの確認
- [ ] `src/components/Sections/MatchSection.jsx` - 試合記録のメインロジック
- [ ] `src/lib/formations.ts` - フォーメーション定義
- [ ] `src/components/StadiumVisionDisplay.jsx` - ビジョン表示

### データ構造の確認
- [ ] `emptyMatch()`関数の定義を確認
- [ ] `FORMATIONS_11`, `FORMATIONS_8`の内容を確認

### テスト項目
- [ ] 11人制/8人制の切り替え動作
- [ ] 得点記録→自動計算の動作
- [ ] ビジョン表示のレスポンシブ動作

---

## 📚 参考リンク

- [プロジェクトリポジトリ](https://github.com/sugita-ops/soccer-app)
- [Vercelデプロイ](https://vercel.com/)
- [Supabaseダッシュボード](https://supabase.com/)

---

## 💡 次にやること（提案）

1. **PWA対応**: オフラインでも使えるようにする
2. **データインポート**: JSON/CSVから選手・試合データを一括登録
3. **統計グラフ**: 選手の成績推移をビジュアル化
4. **印刷最適化**: 試合記録を見やすく印刷できるようにする

---

**このファイルは開発再開時に最初に読むべきドキュメントです**
