import React from "react";
import { importPlayers } from "../lib/jsonStore";

// CSV文字列をオブジェクト配列に変換
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const players = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV行をパース（簡易版）
    const values = line.split(',').map(v => v.trim());

    if (values.length >= 3) {
      const [name, jersey, position] = values;

      // バリデーション
      if (name && jersey && position) {
        players.push({
          name: name,
          jersey: parseInt(jersey) || jersey,
          position: position
        });
      }
    }
  }

  return players;
};

export default function PlayerImport({ onImportComplete }){
  const handleCSVImport = async (file) => {
    try {
      const csvText = await file.text();
      const players = parseCSV(csvText);

      if (players.length === 0) {
        alert('有効な選手データが見つかりませんでした。\n形式: 名前,背番号,ポジション');
        return;
      }

      const { added, updated, skipped } = importPlayers(players);
      const messages = [];

      if (added > 0) messages.push(`新規追加 ${added}件`);
      if (updated > 0) messages.push(`情報更新 ${updated}件`);
      if (skipped.length > 0) {
        const reasons = skipped.map(s => s.reason).slice(0, 3);
        messages.push(`スキップ ${skipped.length}件 (${reasons.join(', ')}${skipped.length > 3 ? '...' : ''})`);
      }

      const result = messages.length > 0 ? messages.join(' / ') : '処理対象がありませんでした';
      alert(`CSV取り込み完了：${result}`);

      // UI再描画を確実に実行
      if (onImportComplete) {
        onImportComplete();
      } else {
        // フォールバック: ページリロード
        location.reload();
      }
    } catch (err) {
      console.error("CSV Import error:", err);
      alert(`CSVの読み込みに失敗しました: ${err.message}`);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '24px',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px',
        border: '2px dashed rgba(255,255,255,0.3)',
        textAlign: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          📁
        </div>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: 'rgba(255,255,255,0.9)',
            color: '#333',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '20px' }}>📊</span>
          CSVファイルを選択
          <input
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handleCSVImport(file);
              e.target.value = ''; // ファイル選択をリセット
            }}
          />
        </label>

        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: '1.5'
        }}>
          <strong>📝 形式:</strong> 名前,背番号,ポジション<br/>
          <strong>例:</strong> 田中太郎,10,MF
        </div>
      </div>
    </div>
  );
}