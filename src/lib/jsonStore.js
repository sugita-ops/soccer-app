export const STORAGE_KEY = "miyachu-soccer-v1";

const defaultData = {
  players: [],          // {id, name, number, position}
  matches: [],          // {id, date, kind, opponent, venue, memo, goals_for, goals_against}
  lineups: [],          // {match_id, player_id, position_key}
  subs: [],             // {id, match_id, out_player_id, in_player_id, minute, reason}
  photos: [],           // {id, match_id, path, caption}
  comments: []          // {id, match_id, author, body, created_at}
};

export function loadJSON() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const data = JSON.parse(raw);
    return { ...structuredClone(defaultData), ...data };
  } catch {
    return structuredClone(defaultData);
  }
}

export function saveJSON(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// エクスポート（Blobを生成してダウンロード）
export function exportJSON(filename = "miyachu-data.json") {
  const data = loadJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// インポート（<input type="file"> で取得したFileを読み込む）
export async function importJSON(file) {
  const text = await file.text();
  const next = JSON.parse(text);
  saveJSON(next);
  return next;
}

// IDユーティリティ
export function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36)}`;
}

// 氏名+背番号を1件追加（重複スキップ）
export function addPlayer({ name, jersey }) {
  const db = loadJSON();
  const number = Number(jersey);
  if (!name || !Number.isFinite(number)) return { added: 0, reason: "invalid" };
  const exists = db.players.some(p => p.number === number || p.name === name.trim());
  if (exists) return { added: 0, reason: "duplicate" };
  db.players.push({ id: uid("p"), name: name.trim(), number });
  saveJSON(db);
  return { added: 1 };
}

// 配列 [{name, jersey}] をまとめ取り込み
export function importPlayers(rows, { dedupeBy = "jersey" } = {}) {
  const db = loadJSON();
  let added = 0;
  const skipped = [];
  for (const row of (rows || [])) {
    const name = row?.name?.trim();
    const number = Number(row?.jersey);
    if (!name || !Number.isFinite(number)) {
      skipped.push({ row, reason: "invalid" });
      continue;
    }
    const dup = db.players.some(p => dedupeBy === "jersey" ? p.number === number : p.name === name);
    if (dup) {
      skipped.push({ row, reason: "duplicate" });
      continue;
    }
    db.players.push({ id: uid("p"), name, number });
    added++;
  }
  saveJSON(db);
  return { added, skipped };
}

// ファイルから取り込み
export async function importPlayersFromFile(file) {
  const text = await file.text();
  const rows = JSON.parse(text);
  return importPlayers(rows, { dedupeBy: "jersey" });
}