// 改善されたインポート機能のテストスクリプト
import fs from 'fs';

// jsonStore.jsの関数をシミュレート（改善版）
const STORAGE_KEY = "soccer:players";
const LEGACY_KEYS = ["players", "miyachu:players", "miyachu-soccer-v1"];

const defaultData = {
  players: [],
  matches: [],
  lineups: [],
  subs: [],
  photos: [],
  comments: []
};

let mockData = { ...defaultData };

function loadJSON() {
  return { ...mockData };
}

function saveJSON(data) {
  mockData = { ...data };
}

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36)}`;
}

// 全角数字を半角に変換
function normalizeNumber(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[０-９]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
  });
}

// 改善されたインポート関数
function importPlayers(rows, { dedupeBy = "jersey" } = {}) {
  const db = loadJSON();
  let added = 0;
  let updated = 0;
  const skipped = [];

  for (const row of (rows || [])) {
    // バリデーションの堅牢化
    const name = row?.name?.trim();
    const rawJersey = row?.jersey ? String(row.jersey).trim() : '';
    const normalizedJersey = normalizeNumber(rawJersey);
    const number = Number(normalizedJersey);

    // より詳細なバリデーション
    let skipReason = null;
    if (!name) {
      skipReason = "名前が空または無効";
    } else if (!rawJersey) {
      skipReason = "背番号が空または無効";
    } else if (!Number.isFinite(number) || number <= 0) {
      skipReason = `背番号「${rawJersey}」が数値として無効`;
    }

    if (skipReason) {
      skipped.push({ row, reason: skipReason });
      continue;
    }

    // 既存の選手を背番号で検索
    const existingPlayerIndex = db.players.findIndex(p => p.number === number);

    if (existingPlayerIndex >= 0) {
      // 背番号が既存の場合 → 上書き（更新）
      db.players[existingPlayerIndex] = {
        ...db.players[existingPlayerIndex],
        name,
        number
      };
      updated++;
    } else {
      // 背番号が存在しない場合 → 新規追加
      db.players.push({ id: uid("p"), name, number });
      added++;
    }
  }

  saveJSON(db);
  return { added, updated, skipped };
}

// テスト実行
console.log("🧪 改善されたインポート機能のテスト開始\n");

// バリデーションテスト
console.log("1️⃣ バリデーション強化テスト");
const validationData = [
  { name: "正常選手", jersey: "10" },
  { name: "全角背番号", jersey: "１１" },
  { name: "空白背番号", jersey: "  " },
  { name: "", jersey: "12" },
  { jersey: "13" },
  { name: "文字背番号", jersey: "abc" },
  { name: "負の背番号", jersey: "-1" },
  { name: "ゼロ背番号", jersey: "0" },
  { name: "小数背番号", jersey: "1.5" }
];

const validationResult = importPlayers(validationData);
console.log("結果:", validationResult);
console.log("スキップ理由:");
validationResult.skipped.forEach((item, index) => {
  console.log(`  ${index + 1}. ${JSON.stringify(item.row)} → ${item.reason}`);
});
console.log("現在の選手:", mockData.players);
console.log("");

// アップサート機能テスト
console.log("2️⃣ アップサート機能テスト");
const updateData = [
  { name: "正常選手（更新）", jersey: "10" },  // 既存 → 更新
  { name: "全角背番号（更新）", jersey: "１１" }, // 既存 → 更新（全角数字対応）
  { name: "新規選手", jersey: "15" }            // 新規
];

const updateResult = importPlayers(updateData);
console.log("結果:", updateResult);
console.log("現在の選手:", mockData.players);
console.log("");

// 結果メッセージ生成のテスト
console.log("3️⃣ ユーザー通知メッセージ生成テスト");
function generateMessage(result) {
  const { added, updated, skipped } = result;
  const messages = [];
  if (added > 0) messages.push(`新規追加 ${added}件`);
  if (updated > 0) messages.push(`情報更新 ${updated}件`);
  if (skipped.length > 0) {
    const reasons = skipped.map(s => s.reason).slice(0, 3);
    messages.push(`スキップ ${skipped.length}件 (${reasons.join(', ')}${skipped.length > 3 ? '...' : ''})`);
  }
  return messages.length > 0 ? messages.join(' / ') : '処理対象がありませんでした';
}

console.log("バリデーションテスト通知:", generateMessage(validationResult));
console.log("アップサートテスト通知:", generateMessage(updateResult));
console.log("");

// 最終集計
console.log("📊 最終結果");
console.log(`総選手数: ${mockData.players.length}人`);
console.log("全選手:", mockData.players.map(p => `#${p.number} ${p.name}`).join(", "));

// デバッグ用関数のシミュレーション
console.log("\n🔧 デバッグ用関数のテスト");
console.log("dumpPlayers():", JSON.stringify(mockData, null, 2));
console.log("clearPlayers(): localStorage cleared (simulation)");