import React, { useState } from 'react';
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
  const [position, setPosition] = useState("");

  const addPlayer = () => {
    if(!name.trim()) return;

    const db = loadJSON();
    const newPlayer = {
      id: crypto.randomUUID(),
      name: name.trim(),
      number: Number(num.trim()) || 0,
      position: position.trim() || ''
    };

    db.players.push(newPlayer);
    saveJSON(db);

    refreshPlayers();
    setName("");
    setNum("");
    setPosition("");
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
          <div>
            <label>ポジション</label>
            <select
              value={position}
              onChange={e=>setPosition(e.target.value)}
              style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
            >
              <option value="">選択してください</option>
              <option value="GK">GK</option>
              <option value="DF">DF</option>
              <option value="MF">MF</option>
              <option value="FW">FW</option>
            </select>
          </div>
        </div>

        <div className="actions" style={{marginTop:8}}>
          <button className="primary" onClick={addPlayer}>
            選手を追加
          </button>
          <span className="kicker">登録人数：{players.length}人</span>
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