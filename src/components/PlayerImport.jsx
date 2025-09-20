import React from "react";
import { importPlayersFromFile } from "../lib/jsonStore";

export default function PlayerImport(){
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
              const { added, skipped } = await importPlayersFromFile(file);
              alert(`取り込み完了：追加 ${added} / スキップ ${skipped.length}`);
              location.reload();
            } catch (err) {
              console.error(err);
              alert("JSONの読み込みに失敗しました");
            }
          }}
        />
      </label>
      <p className="text-sm text-gray-500">※ 形式: [{"name, jersey"}] の配列</p>
    </div>
  );
}