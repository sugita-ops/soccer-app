// インポート機能のテストスクリプト
import fs from 'fs';

// jsonStore.jsの関数をシミュレート
const STORAGE_KEY = "miyachu-soccer-test";

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

// 配列 [{name, jersey}] をまとめ取り込み（アップサート方式）
function importPlayers(rows, { dedupeBy = "jersey" } = {}) {
  const db = loadJSON();
  let added = 0;
  let updated = 0;
  const skipped = [];

  for (const row of (rows || [])) {
    const name = row?.name?.trim();
    const number = Number(row?.jersey);
    if (!name || !Number.isFinite(number)) {
      skipped.push({ row, reason: "invalid" });
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
console.log("🧪 アップサート機能のテスト開始\n");

// 初期データとして既存選手を追加
console.log("1️⃣ 初期データ投入");
const initialPlayers = [
  { name: "田中太郎", jersey: "10" },
  { name: "佐藤花子", jersey: "7" }
];
const initialResult = importPlayers(initialPlayers);
console.log("結果:", initialResult);
console.log("現在の選手:", mockData.players);
console.log("");

// 更新＋新規追加のテスト
console.log("2️⃣ 更新＋新規追加テスト");
const updatePlayers = [
  { name: "田中太郎（更新）", jersey: "10" },  // 既存 → 更新
  { name: "佐藤花子（変更）", jersey: "7" },   // 既存 → 更新
  { name: "新選手A", jersey: "12" },           // 新規
  { name: "新選手B", jersey: "13" }            // 新規
];
const updateResult = importPlayers(updatePlayers);
console.log("結果:", updateResult);
console.log("現在の選手:", mockData.players);
console.log("");

// 無効データのテスト
console.log("3️⃣ 無効データテスト");
const invalidPlayers = [
  { name: "有効な選手", jersey: "20" },       // 有効
  { name: "", jersey: "21" },                 // 無効（名前空）
  { name: "背番号なし" },                     // 無効（背番号なし）
  { jersey: "22" },                           // 無効（名前なし）
  { name: "無効な背番号", jersey: "abc" }     // 無効（背番号が数値でない）
];
const invalidResult = importPlayers(invalidPlayers);
console.log("結果:", invalidResult);
console.log("現在の選手:", mockData.players);
console.log("");

// 最終集計
console.log("📊 最終結果");
console.log(`総選手数: ${mockData.players.length}人`);
console.log("全選手:", mockData.players.map(p => `#${p.number} ${p.name}`).join(", "));