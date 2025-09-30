import React, { useState } from 'react';
import PlayerImport from '../PlayerImport';
import { loadJSON, saveJSON } from '../../lib/jsonStore';

const PlayersSection = ({
  players,
  refreshPlayers,
  cloudPassword,
  setCloudPassword,
  isCloudLoading,
  handleCloudSave
}) => {
  const [name, setName] = useState("");
  const [num, setNum] = useState("");

  const addPlayer = () => {
    if(!name.trim()) return;

    const db = loadJSON();
    const newPlayer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      number: Number(num.trim()) || 0
    };

    db.players.push(newPlayer);
    saveJSON(db);

    refreshPlayers();
    setName("");
    setNum("");
  };

  const deletePlayer = (playerId) => {
    const db = loadJSON();
    db.players = db.players.filter(pl => pl.id !== playerId);
    saveJSON(db);
    refreshPlayers();
  };

  const playerOptions = players
    .slice()
    .sort((a,b)=>(a.number||0) - (b.number||0))
    .map(p => ({ value: p.id, label: p.number ? `#${p.number} ${p.name}` : p.name }));

  const exportPlayers = () => {
    const data = JSON.stringify(players, null, 2);
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "players.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      {/* 選手登録フォーム */}
      <section className="card">
        <h2>👥 選手登録</h2>

        <div className="row">
          <div>
            <label>選手名</label>
            <input
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="例）佐藤 太郎"
            />
          </div>
          <div>
            <label>背番号</label>
            <input
              value={num}
              onChange={e=>setNum(e.target.value)}
              placeholder="10"
              type="number"
            />
          </div>
        </div>

        <div className="actions" style={{marginTop:8}}>
          <button className="primary" onClick={addPlayer}>
            選手を追加
          </button>
          <button className="ghost" onClick={exportPlayers}>
            選手データ書き出し
          </button>
          <span className="kicker">登録人数：{players.length}人</span>
        </div>
      </section>

      {/* JSON取り込み */}
      <section className="card">
        <h3>📂 データ取り込み</h3>
        <PlayerImport onImportComplete={refreshPlayers} />
      </section>

      {/* クラウド保存 */}
      <section className="card">
        <h3>☁️ クラウド保存</h3>
        <div className="row" style={{gap: 8, alignItems: 'flex-end'}}>
          <div style={{flex: 1}}>
            <label>保存パスワード</label>
            <input
              type="password"
              value={cloudPassword}
              onChange={e => setCloudPassword(e.target.value)}
              placeholder="認証用パスワードを入力"
              style={{fontSize: '14px'}}
            />
          </div>
          <button
            className="primary"
            onClick={handleCloudSave}
            disabled={isCloudLoading || !cloudPassword.trim()}
            style={{minHeight: '44px', whiteSpace: 'nowrap'}}
          >
            {isCloudLoading ? "保存中..." : "☁️ クラウド保存"}
          </button>
        </div>
        <div className="kicker" style={{marginTop: 4, fontSize: '11px'}}>
          ※ 全チームで共有される選手データをクラウドに保存
        </div>
      </section>

      {/* 選手一覧 */}
      <section className="card">
        <h3>📋 選手一覧</h3>

        {players.length === 0 ? (
          <div className="kicker">まだ選手が登録されていません。上記フォームから追加してください。</div>
        ) : (
          <>
            <div className="kicker" style={{marginBottom: 8}}>
              {players.length}人の選手が登録されています
            </div>

            <div className="list">
              {playerOptions.map(p => (
                <div key={p.value} style={{
                  padding:"12px",
                  background:"#f8f9fa",
                  borderRadius:"8px",
                  display:"flex",
                  justifyContent:"space-between",
                  alignItems:"center"
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {p.label.match(/#(\d+)/) ? p.label.match(/#(\d+)/)[1] : '?'}
                    </div>
                    <div>
                      <div style={{fontWeight: '500'}}>{p.label}</div>
                      <div className="kicker">ID: {p.value.slice(0, 8)}...</div>
                    </div>
                  </div>

                  <button
                    className="ghost"
                    style={{
                      padding:"6px 12px",
                      fontSize:"12px",
                      color: '#dc2626'
                    }}
                    onClick={() => {
                      if (confirm(`${p.label} を削除しますか？`)) {
                        deletePlayer(p.value);
                      }
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 統計情報 */}
      <section className="card">
        <h3>📊 選手統計</h3>

        <div className="grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12
        }}>
          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#f0fdf4',
            borderRadius: 8,
            border: '1px solid #bbf7d0'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--brand)'}}>
              {players.length}
            </div>
            <div className="kicker">総選手数</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#eff6ff',
            borderRadius: 8,
            border: '1px solid #bfdbfe'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#3b82f6'}}>
              {players.filter(p => p.number).length}
            </div>
            <div className="kicker">背番号有り</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#fefce8',
            borderRadius: 8,
            border: '1px solid #fde047'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#eab308'}}>
              {Math.max(...players.map(p => p.number || 0), 0)}
            </div>
            <div className="kicker">最大背番号</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#fdf2f8',
            borderRadius: 8,
            border: '1px solid #f9a8d4'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#ec4899'}}>
              {players.filter(p => !p.number || p.number === 0).length}
            </div>
            <div className="kicker">背番号未設定</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlayersSection;