export const STORAGE_KEY = "soccer:players";
export const LEGACY_KEYS = ["players", "miyachu:players", "miyachu-soccer-v1"];

const defaultData = {
  players: [],          // {id, name, number, position}
  matches: [],          // {id, date, kind, opponent, venue, memo, goals_for, goals_against}
  lineups: [],          // {match_id, player_id, position_key}
  subs: [],             // {id, match_id, out_player_id, in_player_id, minute, reason}
  photos: [],           // {id, match_id, path, caption}
  comments: []          // {id, match_id, author, body, created_at}
};

// マイグレーション関数
function migrateFromLegacyKeys() {
  for (const legacyKey of LEGACY_KEYS) {
    try {
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        console.log(`🔄 Migrating data from ${legacyKey} to ${STORAGE_KEY}`);
        const parsed = JSON.parse(legacyData);

        // 既存の統一キーデータがあるかチェック
        const currentData = localStorage.getItem(STORAGE_KEY);
        if (!currentData) {
          // 統一キーにデータがない場合のみマイグレーション実行
          localStorage.setItem(STORAGE_KEY, legacyData);
          console.log(`✅ Migration completed from ${legacyKey}`);
        }

        // 古いキーを削除
        localStorage.removeItem(legacyKey);
        console.log(`🗑️ Removed legacy key: ${legacyKey}`);
        break; // 最初に見つかったキーで終了
      }
    } catch (e) {
      console.warn(`⚠️ Failed to migrate from ${legacyKey}:`, e);
    }
  }
}

export function loadJSON() {
  // 初回実行時にマイグレーション
  migrateFromLegacyKeys();

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

// 全角数字を半角に変換
function normalizeNumber(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[０-９]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
  });
}

// 配列 [{name, jersey}] をまとめ取り込み（アップサート方式）
export function importPlayers(rows, { dedupeBy = "jersey" } = {}) {
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

// ファイルから取り込み
export async function importPlayersFromFile(file) {
  const text = await file.text();
  const rows = JSON.parse(text);
  return importPlayers(rows, { dedupeBy: "jersey" });
}

// クラウドからの選手データをローカルにアップサート
export function upsertPlayers(cloudPlayers) {
  if (!Array.isArray(cloudPlayers)) {
    throw new Error("cloudPlayersは配列である必要があります");
  }

  const db = loadJSON();
  let added = 0;
  let updated = 0;
  const skipped = [];

  // ローカル既存選手をMapで索引化（id優先、fallbackでjersey/number）
  const localPlayersMap = new Map();
  db.players.forEach((player, index) => {
    if (player.id) {
      localPlayersMap.set(`id:${player.id}`, { player, index });
    }
    if (player.number !== undefined && player.number !== null) {
      localPlayersMap.set(`jersey:${player.number}`, { player, index });
    }
    if (player.jersey !== undefined && player.jersey !== null) {
      localPlayersMap.set(`jersey:${player.jersey}`, { player, index });
    }
  });

  for (const cloudPlayer of cloudPlayers) {
    try {
      // バリデーション
      if (!cloudPlayer || typeof cloudPlayer !== 'object') {
        skipped.push({ player: cloudPlayer, reason: 'プレイヤーオブジェクトが無効' });
        continue;
      }

      const { id, jersey, number, name } = cloudPlayer;

      if (!name || typeof name !== 'string' || !name.trim()) {
        skipped.push({ player: cloudPlayer, reason: 'nameが無効' });
        continue;
      }

      // id または jersey/number をキーとして使用
      let keyForLookup = null;
      let lookupValue = null;

      if (id) {
        keyForLookup = `id:${id}`;
        lookupValue = id;
      } else if (jersey !== undefined && jersey !== null) {
        keyForLookup = `jersey:${jersey}`;
        lookupValue = jersey;
      } else if (number !== undefined && number !== null) {
        keyForLookup = `jersey:${number}`;
        lookupValue = number;
      }

      if (!keyForLookup) {
        skipped.push({ player: cloudPlayer, reason: 'idまたはjersey/numberが無い' });
        continue;
      }

      // 既存選手を検索
      const existing = localPlayersMap.get(keyForLookup);

      if (existing) {
        // 既存選手を更新
        const updatedPlayer = {
          ...existing.player,
          ...cloudPlayer,
          name: name.trim(),
          // id が元々ある場合は保持、ない場合はクラウドから追加
          id: existing.player.id || id || uid("p")
        };

        db.players[existing.index] = updatedPlayer;
        updated++;
      } else {
        // 新規選手を追加
        const newPlayer = {
          id: id || uid("p"),
          name: name.trim(),
          number: number !== undefined ? number : jersey,
          ...cloudPlayer
        };

        db.players.push(newPlayer);
        added++;
      }
    } catch (error) {
      skipped.push({ player: cloudPlayer, reason: `処理エラー: ${error.message}` });
    }
  }

  saveJSON(db);
  return { added, updated, skipped };
}

// デバッグ用関数をwindowオブジェクトに追加
if (typeof window !== 'undefined') {
  window.dumpPlayers = function() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        console.log("📭 No player data found in localStorage");
        return null;
      }
      const parsed = JSON.parse(data);
      console.log("🗂️ Player data from localStorage:", parsed);
      return parsed;
    } catch (e) {
      console.error("❌ Error reading player data:", e);
      return null;
    }
  };

  window.clearPlayers = function() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log(`🗑️ Cleared player data from ${STORAGE_KEY}`);

      // Legacy keysも削除
      LEGACY_KEYS.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared legacy key: ${key}`);
      });

      return true;
    } catch (e) {
      console.error("❌ Error clearing player data:", e);
      return false;
    }
  };

  window.debugPlayersKeys = function() {
    console.log("🔍 Checking all localStorage keys for player data:");
    console.log(`Primary key: ${STORAGE_KEY} → ${localStorage.getItem(STORAGE_KEY) ? '✅ exists' : '❌ not found'}`);
    LEGACY_KEYS.forEach(key => {
      console.log(`Legacy key: ${key} → ${localStorage.getItem(key) ? '⚠️ exists' : '✅ cleaned'}`);
    });
  };
}