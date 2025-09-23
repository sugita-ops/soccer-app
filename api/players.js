// Vercel Serverless Function for Player Data Cloud Sync
// GET /api/players - 選手データを取得
// POST /api/players - 選手データを保存（認証必要）

import { Octokit } from "@octokit/rest";

// GitHub Gistを使った簡易ストレージ
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const WRITE_PASSWORD = process.env.PLAYER_WRITE_KEY || process.env.WRITE_PASSWORD || "soccer2024";

// デフォルトデータ
const DEFAULT_PLAYERS_DATA = {
  players: [],
  lastUpdated: new Date().toISOString(),
  version: 1
};

// GitHub Gistから選手データを読み取り
async function readPlayersFromGist() {
  if (!GITHUB_TOKEN || !GIST_ID) {
    console.log("GitHub設定がないため、デフォルトデータを返します");
    return DEFAULT_PLAYERS_DATA;
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const response = await octokit.rest.gists.get({ gist_id: GIST_ID });

    const playersFile = response.data.files['players.json'];
    if (playersFile && playersFile.content) {
      return JSON.parse(playersFile.content);
    }

    return DEFAULT_PLAYERS_DATA;
  } catch (error) {
    console.error("Gist読み取りエラー:", error);
    return DEFAULT_PLAYERS_DATA;
  }
}

// GitHub Gistに選手データを保存
async function writePlayersToGist(playersData) {
  if (!GITHUB_TOKEN || !GIST_ID) {
    throw new Error("GitHub設定が不足しています");
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const updateData = {
      ...playersData,
      lastUpdated: new Date().toISOString(),
      version: (playersData.version || 1) + 1
    };

    await octokit.rest.gists.update({
      gist_id: GIST_ID,
      files: {
        'players.json': {
          content: JSON.stringify(updateData, null, 2)
        }
      }
    });

    return updateData;
  } catch (error) {
    console.error("Gist書き込みエラー:", error);
    throw error;
  }
}

// 認証チェック
function checkAuth(req) {
  const authHeader = req.headers.authorization;
  const bodyPassword = req.body?.password;

  // Bearer Token 認証
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === WRITE_PASSWORD;
  }

  // Body内のパスワード認証
  if (bodyPassword) {
    return bodyPassword === WRITE_PASSWORD;
  }

  return false;
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 選手データの読み取り（誰でも可能）
      const playersData = await readPlayersFromGist();

      return res.status(200).json({
        success: true,
        data: playersData,
        message: "選手データを取得しました"
      });

    } else if (req.method === 'POST') {
      // 選手データの保存（認証必要）
      if (!checkAuth(req)) {
        return res.status(401).json({
          success: false,
          message: "認証が必要です。パスワードまたはBearerトークンを指定してください"
        });
      }

      const { players } = req.body;

      if (!Array.isArray(players)) {
        return res.status(400).json({
          success: false,
          message: "players配列が必要です"
        });
      }

      // データの保存
      const savedData = await writePlayersToGist({ players });

      return res.status(200).json({
        success: true,
        data: savedData,
        message: `選手データを保存しました（${players.length}件）`
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }

  } catch (error) {
    console.error("API Error:", error);

    return res.status(500).json({
      success: false,
      message: "サーバーエラーが発生しました",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}