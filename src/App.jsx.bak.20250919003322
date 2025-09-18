import { ui } from "./ui";
import { Button, Card, Field, Input, Select, Badge, Empty } from "./components/ui";// ==== 2025 UI tokens (green×yellow / soft-card) ====
const ui = {
  container: "max-w-5xl mx-auto px-5 md:px-8",
  heroWrap: "rounded-3xl p-6 md:p-8 bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg",
  heroTitle: "text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3",
  heroSub: "mt-1 text-sm md:text-base opacity-90",
  card: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4 transition-all",
  sectionTitle: "text-base md:text-lg font-semibold text-gray-800 flex items-center gap-2",
  dot: "w-1.5 h-1.5 rounded-full bg-yellow-400",
  input: "w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400",
  select: "rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400",
  textArea: "w-full rounded-xl border border-gray-300 px-3 py-2 min-h-[92px] focus:outline-none focus:ring-2 focus:ring-green-400",
  btnPrimary: "px-4 py-2 rounded-xl bg-green-600 text-white shadow-sm hover:bg-green-700 active:scale-[0.99] transition focus:ring-2 focus:ring-green-400",
  btnGhost: "px-4 py-2 rounded-xl border shadow-sm hover:bg-green-50 transition focus:ring-2 focus:ring-green-400",
  chip: "px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 transition",
};import React, { useEffect, useMemo, useState } from "react";const defaultPositions = [
  { key: "GK", label: "GK" },
  { key: "LB", label: "LB" },
  { key: "LCB", label: "LCB" },
  { key: "RCB", label: "RCB" },
  { key: "RB", label: "RB" },
  { key: "LM", label: "LM" },
  { key: "LCM", label: "LCM" },
  { key: "RCM", label: "RCM" },
  { key: "RM", label: "RM" },
  { key: "ST1", label: "ST1" },
  { key: "ST2", label: "ST2" },
];const emptyMatch = () => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0, 16),
  competition: "練習試合",
  opponent: "",
  venue: "",
  scoreFor: "",
  scoreAgainst: "",
  mvp: "",
  notes: "",
  lineup: Object.fromEntries(defaultPositions.map((p) => [p.key, ""])),
  posLabels: Object.fromEntries(defaultPositions.map((p) => [p.key, p.label])),
});const STORAGE_KEY = "soccer_lineup_app_v1";export default function App() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [current, setCurrent] = useState(emptyMatch());
  const [filter, setFilter] = useState("");
  const [assignMode, setAssignMode] = useState(null);
  const [jsonText, setJsonText] = useState("");  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setPlayers(data.players || []);
        setMatches(data.matches || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, matches }));
  }, [players, matches]);  const filteredMatches = useMemo(() => {
    if (!filter.trim()) return matches;
    const q = filter.toLowerCase();
    return matches.filter((m) =>
      [m.competition, m.opponent, m.notes, m.mvp]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [matches, filter]);  const addPlayer = (name, number) => {
    if (!name.trim()) return;
    setPlayers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), number: number?.trim() },
    ]);
  };  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setCurrent((cur) => {
      const updated = { ...cur };
      Object.keys(updated.lineup).forEach((k) => {
        if (updated.lineup[k] === id) updated.lineup[k] = "";
      });
      return updated;
    });
    setMatches((prev) =>
      prev.map((m) => {
        const updated = { ...m };
        Object.keys(updated.lineup).forEach((k) => {
          if (updated.lineup[k] === id) updated.lineup[k] = "";
        });
        return updated;
      })
    );
  };  const assignPlayer = (playerId) => {
    if (!assignMode) return;
    setCurrent((prev) => ({
      ...prev,
      lineup: { ...prev.lineup, [assignMode]: playerId },
    }));
    setAssignMode(null);
  };  const saveMatch = () => {
    if (current.opponent?.trim()) {
      setMatches((prev) => [current, ...prev]);
      setCurrent(emptyMatch());
    }
  };  const loadMatch = (match) => {
    setCurrent({ ...match });
  };  const deleteMatch = (id) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };  const exportData = () => {
    setJsonText(JSON.stringify({ players, matches }, null, 2));
  };  const importData = () => {
    try {
      const data = JSON.parse(jsonText);
      if (data.players) setPlayers(data.players);
      if (data.matches) setMatches(data.matches);
      setJsonText("");
    } catch (e) {
      alert("無効なデータ形式です");
    }
  };  const getPlayerName = (id) => {
    const p = players.find((player) => player.id === id);
    return p ? `${p.name} ${p.number ? `(${p.number})` : ""}` : "";
  };  const exportJSON = () => {
    const data = { players, matches };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `サッカーデータ_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };  const printNow = () => {
    window.print();
  };  return (<div className="min-h-screen bg-gray-50 p-4 ${ui.container}">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 ${ui.heroTitle}">
            <img src="/miyachu.png" alt="宮中サッカー部" className="w-12 h-12 object-cover rounded" />
            行け！宮中サッカー部
          </h1>
  <img src="/miyachu-final.png" alt="行け！宮中サッカー部" className="mt-4 mx-auto rounded-xl shadow-lg w-96" />
          <div className="flex gap-2">
            <button
              onClick={exportJSON}
              className="px-4 py-2 rounded-xl border shadow-sm bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400"
            >
              JSON書き出し
            </button>
            <button
              onClick={printNow}
              className="px-4 py-2 rounded-xl border shadow-sm bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-400"
            >
              印刷
            </button>
          </div>
        </div>        {/* Player Management */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-4">
  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 選手登録・管理
</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="選手名"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = e.target.value;
                  const number = e.target.parentElement.children[1].value;
                  addPlayer(name, number);
                  e.target.value = "";
                  e.target.parentElement.children[1].value = "";
                }
              }}
            />
            <input
              type="text"
              placeholder="背番号"
              className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const number = e.target.value;
                  const name = e.target.parentElement.children[0].value;
                  addPlayer(name, number);
                  e.target.value = "";
                  e.target.parentElement.children[0].value = "";
                }
              }}
            />
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={() => {
                const inputs = document.querySelectorAll('input[placeholder="選手名"], input[placeholder="背番号"]');
                addPlayer(inputs[0].value, inputs[1].value);
                inputs[0].value = "";
                inputs[1].value = "";
              }}
            >
              追加
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-40 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-2 border rounded cursor-pointer text-sm ${
                  assignMode
                    ? "bg-green-50 hover:bg-green-100 border-green-300"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => assignMode && assignPlayer(player.id)}
              >
                <div className="flex justify-between items-center">
                  <span>{player.name}</span>
                  {player.number && (
                    <span className="text-xs bg-gray-200 px-1 rounded">
                      {player.number}
                    </span>
                  )}
                </div>
                <button
                  className="text-xs text-red-600 hover:text-red-800 mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlayer(player.id);
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>        {/* Current Match */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-4">
  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 試合記録
</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input
              type="datetime-local"
              value={current.date}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, date: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={current.competition}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, competition: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg"
            >
              <option value="練習試合">練習試合</option>
              <option value="リーグ戦">リーグ戦</option>
              <option value="カップ戦">カップ戦</option>
              <option value="その他">その他</option>
            </select>
            <input
              type="text"
              placeholder="対戦相手"
              value={current.opponent}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, opponent: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="会場"
              value={current.venue}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, venue: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg"
            />
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="得点"
                value={current.scoreFor}
                onChange={(e) =>
                  setCurrent((prev) => ({ ...prev, scoreFor: e.target.value }))
                }
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <span className="self-center">-</span>
              <input
                type="number"
                placeholder="失点"
                value={current.scoreAgainst}
                onChange={(e) =>
                  setCurrent((prev) => ({ ...prev, scoreAgainst: e.target.value }))
                }
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <input
              type="text"
              placeholder="MVP"
              value={current.mvp}
              onChange={(e) =>
                setCurrent((prev) => ({ ...prev, mvp: e.target.value }))
              }
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <textarea
            placeholder="試合メモ"
            value={current.notes}
            onChange={(e) =>
              setCurrent((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg mb-4"
            rows="3"
          />          {/* Formation */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">スターティングメンバー (4-4-2)</h3>
            {assignMode && (
              <div className="mb-2 p-2 bg-green-50 rounded text-sm">
                {assignMode} のポジションに選手を割り当ててください
                <button
                  className="ml-2 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  onClick={() => setAssignMode(null)}
                >
                  キャンセル
                </button>
              </div>
            )}
            <div className="relative bg-green-100 rounded-lg p-4 min-h-96">
              {/* Goalkeeper */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <PositionSlot
                  position="GK"
                  player={getPlayerName(current.lineup.GK)}
                  onClick={() => setAssignMode("GK")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, GK: "" },
                    }))
                  }
                />
              </div>              {/* Defenders */}
              <div className="absolute bottom-16 left-4">
                <PositionSlot
                  position="LB"
                  player={getPlayerName(current.lineup.LB)}
                  onClick={() => setAssignMode("LB")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, LB: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute bottom-16 left-1/3 transform -translate-x-1/2">
                <PositionSlot
                  position="LCB"
                  player={getPlayerName(current.lineup.LCB)}
                  onClick={() => setAssignMode("LCB")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, LCB: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute bottom-16 right-1/3 transform translate-x-1/2">
                <PositionSlot
                  position="RCB"
                  player={getPlayerName(current.lineup.RCB)}
                  onClick={() => setAssignMode("RCB")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, RCB: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute bottom-16 right-4">
                <PositionSlot
                  position="RB"
                  player={getPlayerName(current.lineup.RB)}
                  onClick={() => setAssignMode("RB")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, RB: "" },
                    }))
                  }
                />
              </div>              {/* Midfielders */}
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <PositionSlot
                  position="LM"
                  player={getPlayerName(current.lineup.LM)}
                  onClick={() => setAssignMode("LM")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, LM: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                <PositionSlot
                  position="LCM"
                  player={getPlayerName(current.lineup.LCM)}
                  onClick={() => setAssignMode("LCM")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, LCM: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2">
                <PositionSlot
                  position="RCM"
                  player={getPlayerName(current.lineup.RCM)}
                  onClick={() => setAssignMode("RCM")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, RCM: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                <PositionSlot
                  position="RM"
                  player={getPlayerName(current.lineup.RM)}
                  onClick={() => setAssignMode("RM")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, RM: "" },
                    }))
                  }
                />
              </div>              {/* Strikers */}
              <div className="absolute top-16 left-1/3 transform -translate-x-1/2">
                <PositionSlot
                  position="ST1"
                  player={getPlayerName(current.lineup.ST1)}
                  onClick={() => setAssignMode("ST1")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, ST1: "" },
                    }))
                  }
                />
              </div>
              <div className="absolute top-16 right-1/3 transform translate-x-1/2">
                <PositionSlot
                  position="ST2"
                  player={getPlayerName(current.lineup.ST2)}
                  onClick={() => setAssignMode("ST2")}
                  onClear={() =>
                    setCurrent((prev) => ({
                      ...prev,
                      lineup: { ...prev.lineup, ST2: "" },
                    }))
                  }
                />
              </div>
            </div>
          </div>          <button
            onClick={saveMatch}
            disabled={!current.opponent?.trim()}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            試合を保存
          </button>
        </div>        {/* Match History */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-4">
  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 過去の試合
</h2>
            <input
              type="text"
              placeholder="試合を検索..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="border rounded p-3 hover:bg-green-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-4 text-sm text-gray-600 mb-1">
                      <span>{new Date(match.date).toLocaleString()}</span>
                      <span>{match.competition}</span>
                      {match.venue && <span>@ {match.venue}</span>}
                    </div>
                    <div className="font-semibold">
                      vs {match.opponent}
                      {match.scoreFor !== "" && match.scoreAgainst !== "" && (
                        <span className="ml-2 text-lg">
                          {match.scoreFor} - {match.scoreAgainst}
                        </span>
                      )}
                    </div>
                    {match.mvp && (
                      <div className="text-sm text-green-600">MVP: {match.mvp}</div>
                    )}
                    {match.notes && (
                      <div className="text-sm text-gray-600 mt-1">
                        {match.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => loadMatch(match)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>        {/* Data Import/Export */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-4">
  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> データの管理
</h2>
          <div className="flex gap-4 mb-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              データエクスポート
            </button>
            <button
              onClick={importData}
              disabled={!jsonText.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              データインポート
            </button>
          </div>
          {jsonText && (
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-32 px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder="データをここに貼り付け"
            />
          )}
        </div>
      </div>
    </div>
  );
}function PositionSlot({ position, player, onClick, onClear }) {
  return (
    <div className="text-center">
      <div
        className="w-16 h-16 bg-white border-2 border-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-50 mb-1"
        onClick={onClick}
      >
        <span className="text-xs font-bold text-green-800">{position}</span>
      </div>
      {player && (
        <div className="bg-white border border-gray-300 rounded px-2 py-1 text-xs relative">
          <div className="truncate w-20">{player}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}