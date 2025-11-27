# 重要な実装コード

このドキュメントには、システムの核となるコードスニペットと実装ロジックを記載します。

---

## 1. フォーメーション管理

### ファイル: `src/components/Sections/MatchSection.jsx`

#### フォーメーション定義（7-59行目）
```javascript
// 11人制フォーメーション
const FORMATIONS_11 = {
  "4-4-2": [
    "GK","LB","LCB","RCB","RB",
    "LM","LCM","RCM","RM",
    "ST1","ST2",
  ],
  "4-3-3": [
    "GK","LB","LCB","RCB","RB",
    "CDM","LCM","RCM",
    "LW","ST","RW",
  ],
  "3-5-2": [
    "GK","LCB","CB","RCB",
    "LWB","LCM","CDM","RCM","RWB",
    "ST1","ST2",
  ],
  "4-2-3-1": [
    "GK","LB","LCB","RCB","RB",
    "CDM1","CDM2",
    "LAM","CAM","RAM",
    "ST",
  ],
  "3-4-3": [
    "GK","LCB","CB","RCB",
    "LM","LCM","RCM","RM",
    "LW","ST","RW",
  ]
};

// 8人制フォーメーション
const FORMATIONS_8 = {
  "2-3-2": [
    "GK","LCB","RCB",
    "LM","CM","RM",
    "ST1","ST2",
  ],
  "3-2-2": [
    "GK","LCB","CB","RCB",
    "LCM","RCM",
    "ST1","ST2",
  ],
  "2-4-1": [
    "GK","LCB","RCB",
    "LM","LCM","RCM","RM",
    "ST",
  ],
  "3-3-1": [
    "GK","LCB","CB","RCB",
    "LM","CM","RM",
    "ST",
  ]
};
```

#### 人数に応じたフォーメーション取得（119-122行目）
```javascript
const getCurrentFormations = () => {
  return match.playerCount === 8 ? FORMATIONS_8 : FORMATIONS_11;
};
```

#### 人数切り替え時の処理（133-146行目）
```javascript
const changePlayerCount = (newCount) => {
  const FORMATIONS = newCount === 8 ? FORMATIONS_8 : FORMATIONS_11;
  const defaultFormation = newCount === 8 ? "2-3-2" : "4-4-2";
  const newLineup = FORMATIONS[defaultFormation].reduce((acc, pos) => {
    acc[pos] = "";
    return acc;
  }, {});
  setMatch(m => ({
    ...m,
    playerCount: newCount,
    formation: defaultFormation,
    lineup: newLineup  // 重要: リセット
  }));
};
```

---

## 2. 得点記録システム

### ファイル: `src/components/Sections/MatchSection.jsx`

#### 得点保存処理（247-266行目）
```javascript
const saveGoal = (goal) => {
  setMatch(m => {
    let newGoals;
    if (editingGoal) {
      // 編集モード
      newGoals = m.goals.map(g => g.id === goal.id ? goal : g);
    } else {
      // 新規追加
      newGoals = [...(m.goals || []), goal];
    }

    return {
      ...m,
      goals: newGoals,
      goalsFor: String(newGoals.length)  // 🔥 自動計算
    };
  });

  closeGoalModal();
};
```

#### 得点削除処理（268-279行目）
```javascript
const deleteGoal = (goalId) => {
  if (!confirm('この得点記録を削除しますか？')) return;

  setMatch(m => {
    const newGoals = m.goals.filter(g => g.id !== goalId);
    return {
      ...m,
      goals: newGoals,
      goalsFor: String(newGoals.length)  // 🔥 再計算
    };
  });
};
```

### ファイル: `src/components/GoalRecordingModal.jsx`

#### モーダル状態リセット（16-28行目）
```javascript
// 🔥 重要: existingGoalが変わるたびに状態をリセット
useEffect(() => {
  if (existingGoal) {
    setGoalData(existingGoal);
  } else {
    setGoalData({
      minute: '',
      scorer: '',
      assist: '',
      noAssist: false
    });
  }
}, [existingGoal]);
```

**なぜ必要？**
useEffectでリセットしないと、前回のモーダル入力が残ったままになり、
新規追加時に古いデータが混入する。

---

## 3. ポジションカテゴリ化

### ファイル: `src/components/Sections/MatchSection.jsx` (62-68行目)

```javascript
const getPositionCategory = (position) => {
  if (position === 'GK') return 'GK';
  if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DF';
  if (['LM', 'LCM', 'CM', 'CDM', 'CDM1', 'CDM2', 'RCM', 'RM', 'LAM', 'CAM', 'RAM'].includes(position)) return 'MF';
  if (['LW', 'ST', 'ST1', 'ST2', 'RW'].includes(position)) return 'FW';
  return position;
};
```

### ファイル: `src/components/StadiumVisionDisplay.jsx` (25-32行目)

```javascript
// 同じロジック（重複しているが各コンポーネントで独立）
const getPositionCategory = (position) => {
  if (position === 'GK') return 'GK'
  if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DF'
  if (['LM', 'LCM', 'CM', 'CDM', 'CDM1', 'CDM2', 'RCM', 'RM', 'LAM', 'CAM', 'RAM'].includes(position)) return 'MF'
  if (['LW', 'ST', 'ST1', 'ST2', 'RW'].includes(position)) return 'FW'
  return position
}
```

**使用例**:
```javascript
// MatchSection.jsx (643行目)
const posCategory = getPositionCategory(pos);
return (
  <div key={pos}>
    <label>{posCategory}</label>  {/* "DF" と表示される */}
    <select>...</select>
  </div>
);
```

---

## 4. フォーメーション座標マッピング

### ファイル: `src/lib/formations.ts`

#### 型定義（1行目）
```typescript
export type FormationKey =
  '4-4-2' | '4-2-3-1' | '4-3-3' | '3-5-2' | '5-3-2' | '3-4-2-1' |  // 11人制
  '2-3-2' | '3-2-2' | '2-4-1' | '3-3-1';                           // 8人制
```

#### 座標マッピング（3行目〜）
```typescript
export const formationMap: Record<FormationKey,
  { x: number; y: number; role: 'GK'|'DF'|'MF'|'FW' }[]> = {

  '4-4-2': [
    {x:50,y:94,role:'GK'},
    {x:15,y:75,role:'DF'},{x:35,y:78,role:'DF'},{x:65,y:78,role:'DF'},{x:85,y:75,role:'DF'},
    {x:18,y:55,role:'MF'},{x:38,y:58,role:'MF'},{x:62,y:58,role:'MF'},{x:82,y:55,role:'MF'},
    {x:35,y:35,role:'FW'},{x:65,y:35,role:'FW'},
  ],

  // 8人制フォーメーション
  '2-3-2': [
    {x:50,y:94,role:'GK'},
    {x:35,y:78,role:'DF'},{x:65,y:78,role:'DF'},
    {x:25,y:55,role:'MF'},{x:50,y:58,role:'MF'},{x:75,y:55,role:'MF'},
    {x:40,y:35,role:'FW'},{x:60,y:35,role:'FW'},
  ],

  // ...他のフォーメーション
};
```

**座標系**:
- x: 0-100（横方向、左から右）
- y: 0-100（縦方向、上から下、ゴールが0）
- ピッチは下から上に攻める想定（GKがy=94付近）

---

## 5. 試合データ初期化

### ファイル: `src/components/Sections/MatchSection.jsx` (70-95行目)

```javascript
const emptyMatch = (playerCount = 11, formation = "4-4-2") => {
  const FORMATIONS = playerCount === 8 ? FORMATIONS_8 : FORMATIONS_11;
  const defaultFormation = playerCount === 8 ? "2-3-2" : "4-4-2";
  const selectedFormation = formation || defaultFormation;

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0,16),
    type: "練習試合",
    opponent: "",
    venue: "",
    goalsFor: "",
    goalsAgainst: "",
    mvp: "",
    notes: "",
    playerCount: playerCount,  // 🔥 重要: デフォルト11
    formation: selectedFormation,
    lineup: FORMATIONS[selectedFormation]?.reduce((acc,k)=> (acc[k]="", acc), {}) || {},
    photos: [],
    youtubeUrl: "",
    substitutions: [],
    goals: [],  // 🔥 重要: 得点配列
    isMultiMatch: false,
    subMatches: [],
  };
};
```

---

## 6. スタジアムビジョン演出

### ファイル: `src/components/StadiumVisionDisplay.jsx`

#### 観客席シルエット（上部、64-85行目）
```javascript
<div style={{
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '120px',
  background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
  zIndex: 1,
  pointerEvents: 'none'
}}>
  {/* 観客シルエット */}
  <div style={{
    position: 'absolute',
    top: '10px',
    left: 0,
    right: 0,
    height: '60px',
    background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 3px, transparent 3px, transparent 8px)',
    opacity: 0.6
  }} />
</div>
```

#### スポットライト効果（110-121行目）
```javascript
<div style={{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '60%',
  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)',
  pointerEvents: 'none',
  zIndex: 0
}} />
```

#### 3D効果（173-184行目）
```javascript
<div style={{
  perspective: '1000px'  // 🔥 3D空間の定義
}}>
  {/* スコアカード */}
  <div style={{
    transform: 'rotateX(2deg)',  // 🔥 軽い傾き
    transformStyle: 'preserve-3d',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.2)'
  }}>
    {/* コンテンツ */}
  </div>
</div>
```

---

## 7. レスポンシブ対応

### ファイル: `src/components/GoalTimeline.jsx` (10-15行目)

```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

// ウィンドウリサイズを監視
window.addEventListener('resize', () => {
  setIsMobile(window.innerWidth < 768);
});
```

#### 条件分岐レンダリング（42-193行目）
```javascript
if (isMobile) {
  return (
    // 縦スクロールカード表示
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {sortedGoals.map(goal => (
        <div>{/* カード */}</div>
      ))}
    </div>
  );
}

// デスクトップ表示（横長タイムライン）
return (
  <div style={{position: 'relative', padding: '24px 0'}}>
    {/* タイムライン本体 */}
  </div>
);
```

---

## 8. エクスポート構造の変更

### ファイル: `src/components/Sections/MatchSection.jsx` (929-930行目)

```javascript
export default MatchSection;
export { emptyMatch, FORMATIONS_11, FORMATIONS_8 };
```

**以前の問題**:
```javascript
export { emptyMatch, FORMATIONS };  // ❌ FORMATIONSが存在しない
```

### ファイル: `src/components/Sections/HistorySection.jsx` (2-8行目)

```javascript
import { FORMATIONS_11, FORMATIONS_8 } from './MatchSection';

// 全フォーメーションを統合
const ALL_FORMATIONS = {
  ...FORMATIONS_11,
  ...FORMATIONS_8
};
```

**使用箇所** (356行目):
```javascript
{(ALL_FORMATIONS[m.formation || "4-4-2"] || ALL_FORMATIONS["4-4-2"]).map(k => {
  // ...
})}
```

---

## 9. デフォルト値の扱い

### playerCountのフォールバック
```javascript
// MatchSection.jsx (604行目)
checked={match.playerCount === 11 || !match.playerCount}
```

**理由**: 既存の試合データには`playerCount`フィールドが存在しない可能性がある。
その場合は11人制とみなす。

### フォーメーションのフォールバック
```javascript
// 各所で使用
match.formation || (match.playerCount === 8 ? "2-3-2" : "4-4-2")
```

---

## 10. 重要な注意点

### 1. 状態更新のタイミング
```javascript
// ❌ 間違い
setMatch({ ...match, goals: newGoals });
setMatch({ ...match, goalsFor: String(newGoals.length) });

// ✅ 正しい（1回の更新で完結）
setMatch(m => ({
  ...m,
  goals: newGoals,
  goalsFor: String(newGoals.length)
}));
```

### 2. useEffectの依存配列
```javascript
// GoalRecordingModal.jsx
useEffect(() => {
  // existingGoalが変わるたびに実行
}, [existingGoal]);  // 🔥 依存配列を忘れずに
```

### 3. オプショナルチェーン
```javascript
// 安全なアクセス
match.goals?.length || 0
FORMATIONS[selectedFormation]?.reduce(...)
```

---

## まとめ

これらのコードスニペットは、システムの核となる実装です。
開発再開時には、これらのロジックを理解した上でコードを読むと、
全体像を素早く把握できます。
