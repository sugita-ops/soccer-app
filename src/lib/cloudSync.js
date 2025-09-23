// クラウド同期機能
import { loadJSON, upsertPlayers } from './jsonStore';

const API_BASE = '/api';

// クラウドから選手データを取得
export async function loadPlayersFromCloud() {
  try {
    const response = await fetch(`${API_BASE}/players`);
    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('クラウド読み取りエラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました'
    };
  }
}

// クラウドに選手データを保存
export async function savePlayersToCloud(players, password) {
  try {
    const response = await fetch(`${API_BASE}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`
      },
      body: JSON.stringify({ players })
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('クラウド保存エラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました'
    };
  }
}

// ローカルとクラウドのデータを同期（アップサート方式）
export async function syncWithCloud() {
  try {
    const cloudResult = await loadPlayersFromCloud();

    if (!cloudResult.success) {
      return {
        success: false,
        error: cloudResult.error,
        action: 'none'
      };
    }

    const cloudData = cloudResult.data;
    const cloudPlayers = cloudData.players || [];

    if (cloudPlayers.length === 0) {
      return {
        success: true,
        action: 'no_change',
        message: 'クラウドに選手データがありません'
      };
    }

    // バリデーションとアップサート実行
    const validPlayers = cloudPlayers.filter(player => {
      return player &&
             typeof player === 'object' &&
             player.name &&
             typeof player.name === 'string' &&
             (player.id || player.jersey !== undefined || player.number !== undefined);
    });

    if (validPlayers.length === 0) {
      return {
        success: true,
        action: 'no_change',
        message: 'クラウドデータに有効な選手がいません'
      };
    }

    const result = upsertPlayers(validPlayers);

    if (result.added === 0 && result.updated === 0) {
      return {
        success: true,
        action: 'no_change',
        message: 'ローカルデータが最新です'
      };
    }

    return {
      success: true,
      action: 'imported',
      message: `クラウド同期完了：追加 ${result.added} / 更新 ${result.updated}`,
      players: validPlayers,
      stats: {
        added: result.added,
        updated: result.updated,
        skipped: result.skipped.length
      }
    };

  } catch (error) {
    console.error('クラウド同期エラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました',
      action: 'none'
    };
  }
}

// 手動でクラウドと同期（競合解決付き）
export async function manualSync() {
  const cloudResult = await loadPlayersFromCloud();
  const localData = loadJSON();

  if (!cloudResult.success) {
    return {
      success: false,
      error: cloudResult.error
    };
  }

  const cloudData = cloudResult.data;
  const localPlayers = localData.players || [];
  const cloudPlayers = cloudData.players || [];

  // データの比較
  const comparison = {
    local: {
      count: localPlayers.length,
      lastUpdated: localData.lastUpdated || 'unknown'
    },
    cloud: {
      count: cloudPlayers.length,
      lastUpdated: cloudData.lastUpdated || 'unknown'
    }
  };

  return {
    success: true,
    comparison,
    needsResolution: localPlayers.length > 0 && cloudPlayers.length > 0
  };
}

// 「今すぐ同期」機能 - アップサート方式でクラウドから同期
export async function syncFromCloudUpsert() {
  try {
    const cloudResult = await loadPlayersFromCloud();

    if (!cloudResult.success) {
      return {
        success: false,
        error: cloudResult.error || 'クラウドからの取得に失敗しました'
      };
    }

    const cloudData = cloudResult.data;
    const cloudPlayers = cloudData.players || [];

    if (cloudPlayers.length === 0) {
      return {
        success: true,
        action: 'no_data',
        message: 'クラウドに選手データがありません',
        stats: { added: 0, updated: 0, skipped: 0 }
      };
    }

    // バリデーションとアップサート実行
    const validPlayers = cloudPlayers.filter(player => {
      return player &&
             typeof player === 'object' &&
             player.name &&
             typeof player.name === 'string' &&
             (player.id || player.jersey !== undefined || player.number !== undefined);
    });

    if (validPlayers.length === 0) {
      return {
        success: false,
        error: 'クラウドデータに有効な選手がいません',
        stats: { added: 0, updated: 0, skipped: cloudPlayers.length }
      };
    }

    const result = upsertPlayers(validPlayers);

    return {
      success: true,
      action: 'upserted',
      message: `クラウド同期完了：追加 ${result.added} / 更新 ${result.updated}`,
      stats: {
        added: result.added,
        updated: result.updated,
        skipped: result.skipped.length
      },
      skippedDetails: result.skipped
    };

  } catch (error) {
    console.error('クラウド同期エラー:', error);
    return {
      success: false,
      error: error.message || 'ネットワークエラーが発生しました'
    };
  }
}