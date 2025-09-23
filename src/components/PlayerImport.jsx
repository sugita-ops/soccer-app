import React from "react";
import { importPlayersFromFile } from "../lib/jsonStore";

export default function PlayerImport({ onImportComplete }){
  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:bg-gray-50">
        選手JSON取り込み
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const { added, updated, skipped } = await importPlayersFromFile(file);
              const messages = [];
              if (added > 0) messages.push(`新規追加 ${added}件`);
              if (updated > 0) messages.push(`情報更新 ${updated}件`);
              if (skipped.length > 0) {
                // より詳細なスキップ理由表示
                const reasons = skipped.map(s => s.reason).slice(0, 3);
                messages.push(`スキップ ${skipped.length}件 (${reasons.join(', ')}${skipped.length > 3 ? '...' : ''})`);
              }

              const result = messages.length > 0 ? messages.join(' / ') : '処理対象がありませんでした';
              alert(`取り込み完了：${result}`);

              // UI再描画を確実に実行
              if (onImportComplete) {
                onImportComplete();
              } else {
                // フォールバック: ページリロード
                location.reload();
              }
            } catch (err) {
              console.error("Import error:", err);
              alert(`JSONの読み込みに失敗しました: ${err.message}`);
            }
          }}
        />
      </label>
      <p className="text-sm text-gray-500">※ 形式: [{"name, jersey"}] の配列</p>
    </div>
  );
}