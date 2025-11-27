# データ構造詳細

## 選手データ (Player)

### TypeScript型定義
```typescript
interface Player {
  id: string;           // UUID
  name: string;         // 選手名
  number?: number;      // 背番号（任意）
  position?: string;    // ポジション（任意）
  grade?: string;       // 学年（任意）
}
```

### 実例
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "杉田僚",
  "number": 23,
  "position": "MF",
  "grade": "2年"
}
```

### 保存先
- **localStorage**: `soccer_players_{teamId}`
- **Supabase**: `players`テーブル

---

## 試合データ (Match)

### TypeScript型定義
```typescript
interface Match {
  id: string;                    // UUID
  date: string;                  // ISO datetime-local形式
  type: MatchType;               // 試合種別
  opponent: string;              // 対戦相手
  venue: string;                 // 会場
  playerCount: 11 | 8;           // 人数（11人制 or 8人制）
  formation: FormationKey;       // フォーメーション
  lineup: Record<string, string>; // ポジション → 選手ID
  goalsFor: string;              // 得点（自動計算）
  goalsAgainst: string;          // 失点
  goals: Goal[];                 // 得点詳細
  substitutions: Substitution[]; // 交代履歴
  photos: string[];              // 写真URL or Base64
  youtubeUrl: string;            // YouTube動画URL
  mvp: string;                   // MVP選手名
  notes: string;                 // メモ
  isMultiMatch: boolean;         // 複数試合記録フラグ
  subMatches: SubMatch[];        // 複数試合データ
}

type MatchType = "練習試合" | "公式戦" | "招待/カップ戦";

type FormationKey =
  // 11人制
  | "4-4-2" | "4-3-3" | "3-5-2" | "4-2-3-1" | "3-4-3"
  // 8人制
  | "2-3-2" | "3-2-2" | "2-4-1" | "3-3-1";
```

### 得点データ (Goal)
```typescript
interface Goal {
  id: string;           // UUID
  minute: number;       // 得点時間（分）
  scorer: string;       // 得点者の選手ID
  assist: string | null; // アシスト者の選手ID（任意）
}
```

### 交代データ (Substitution)
```typescript
interface Substitution {
  id: string;          // UUID
  minute: number;      // 交代時間（分）
  out: string;         // OUT選手ID
  in: string;          // IN選手ID
  reason: string;      // 交代理由（任意）
}
```

### 複数試合データ (SubMatch)
```typescript
interface SubMatch {
  id: string;
  matchNumber: number;
  goalsFor: string;
  goalsAgainst: string;
  lineup: Record<string, string>;
  substitutions: Substitution[];
}
```

---

## 実際の試合データ例

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-11-27T14:00",
  "type": "練習試合",
  "opponent": "○○中学校",
  "venue": "宮中グラウンド",
  "playerCount": 11,
  "formation": "4-4-2",
  "lineup": {
    "GK": "player-id-1",
    "LB": "player-id-2",
    "LCB": "player-id-3",
    "RCB": "player-id-4",
    "RB": "player-id-5",
    "LM": "player-id-6",
    "LCM": "player-id-7",
    "RCM": "player-id-8",
    "RM": "player-id-9",
    "ST1": "player-id-10",
    "ST2": "player-id-11"
  },
  "goalsFor": "3",
  "goalsAgainst": "1",
  "goals": [
    {
      "id": "goal-1",
      "minute": 15,
      "scorer": "player-id-10",
      "assist": "player-id-7"
    },
    {
      "id": "goal-2",
      "minute": 45,
      "scorer": "player-id-11",
      "assist": null
    },
    {
      "id": "goal-3",
      "minute": 78,
      "scorer": "player-id-10",
      "assist": "player-id-9"
    }
  ],
  "substitutions": [
    {
      "id": "sub-1",
      "minute": 60,
      "out": "player-id-6",
      "in": "player-id-12",
      "reason": "疲労"
    }
  ],
  "photos": [
    "https://example.com/photo1.jpg",
    "data:image/jpeg;base64,..."
  ],
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "mvp": "杉田僚",
  "notes": "前半から攻撃的に。後半に疲れが見えた。",
  "isMultiMatch": false,
  "subMatches": []
}
```

---

## フォーメーション定義

### 11人制フォーメーション
```javascript
const FORMATIONS_11 = {
  "4-4-2": [
    "GK","LB","LCB","RCB","RB",
    "LM","LCM","RCM","RM",
    "ST1","ST2"
  ],
  "4-3-3": [
    "GK","LB","LCB","RCB","RB",
    "CDM","LCM","RCM",
    "LW","ST","RW"
  ],
  "3-5-2": [
    "GK","LCB","CB","RCB",
    "LWB","LCM","CDM","RCM","RWB",
    "ST1","ST2"
  ],
  "4-2-3-1": [
    "GK","LB","LCB","RCB","RB",
    "CDM1","CDM2",
    "LAM","CAM","RAM",
    "ST"
  ],
  "3-4-3": [
    "GK","LCB","CB","RCB",
    "LM","LCM","RCM","RM",
    "LW","ST","RW"
  ]
};
```

### 8人制フォーメーション
```javascript
const FORMATIONS_8 = {
  "2-3-2": [
    "GK","LCB","RCB",
    "LM","CM","RM",
    "ST1","ST2"
  ],
  "3-2-2": [
    "GK","LCB","CB","RCB",
    "LCM","RCM",
    "ST1","ST2"
  ],
  "2-4-1": [
    "GK","LCB","RCB",
    "LM","LCM","RCM","RM",
    "ST"
  ],
  "3-3-1": [
    "GK","LCB","CB","RCB",
    "LM","CM","RM",
    "ST"
  ]
};
```

---

## ポジション略語の意味

| 略語 | 英語 | 日本語 | カテゴリ |
|------|------|--------|---------|
| GK | Goalkeeper | ゴールキーパー | GK |
| LB | Left Back | 左サイドバック | DF |
| RB | Right Back | 右サイドバック | DF |
| LCB | Left Center Back | 左センターバック | DF |
| CB | Center Back | センターバック | DF |
| RCB | Right Center Back | 右センターバック | DF |
| LWB | Left Wing Back | 左ウイングバック | DF |
| RWB | Right Wing Back | 右ウイングバック | DF |
| LM | Left Midfielder | 左ミッドフィールダー | MF |
| CM | Center Midfielder | センターミッドフィールダー | MF |
| RM | Right Midfielder | 右ミッドフィールダー | MF |
| LCM | Left Center Midfielder | 左中央ミッドフィールダー | MF |
| RCM | Right Center Midfielder | 右中央ミッドフィールダー | MF |
| CDM | Center Defensive Midfielder | 守備的ミッドフィールダー | MF |
| CAM | Center Attacking Midfielder | 攻撃的ミッドフィールダー | MF |
| LAM | Left Attacking Midfielder | 左攻撃的ミッドフィールダー | MF |
| RAM | Right Attacking Midfielder | 右攻撃的ミッドフィールダー | MF |
| LW | Left Winger | 左ウイング | FW |
| RW | Right Winger | 右ウイング | FW |
| ST | Striker | ストライカー | FW |
| ST1 | Striker 1 | 第1ストライカー | FW |
| ST2 | Striker 2 | 第2ストライカー | FW |

---

## データ保存先

### localStorage
- **キー形式**: `soccer_{dataType}_{teamId}`
- **データ種別**:
  - `soccer_players_default`: 選手データ
  - `soccer_matches_default`: 試合データ
  - `soccer_team_default`: チーム設定（ユニフォームなど）

### Supabase
- **テーブル**:
  - `players`: 選手マスタ
  - `matches`: 試合記録
  - `statistics`: 統計データ（集計用）

---

## データフロー

```
入力（UI）
  ↓
State管理（React useState）
  ↓
保存処理
  ├→ localStorage（即座に保存）
  └→ Supabase（バックグラウンドで同期）
  ↓
読み込み
  ├→ localStorage優先
  └→ Supabaseから補完
  ↓
表示（UI）
```
