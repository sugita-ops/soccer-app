import React, { useState } from 'react';
import UniformPicker from '../UniformPicker';
import FormationPitch from '../FormationPitch';

const FORMATIONS = {
  "4-4-2": [
    "GK","LB","LCB","RCB","RB",
    "LM","LCM","RCM","RM",
    "ST1","ST2",
  ],
  "4-3-3": [
    "GK","LB","LCB","RCB","RB",
    "CDM","LCM","RCM",
    "LW","ST","RW",
  ],
  "3-5-2": [
    "GK","LCB","CB","RCB",
    "LWB","LCM","CDM","RCM","RWB",
    "ST1","ST2",
  ],
  "4-2-3-1": [
    "GK","LB","LCB","RCB","RB",
    "CDM1","CDM2",
    "LAM","CAM","RAM",
    "ST",
  ],
  "3-4-3": [
    "GK","LCB","CB","RCB",
    "LM","LCM","RCM","RM",
    "LW","ST","RW",
  ]
};

const emptyMatch = (formation = "4-4-2") => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().slice(0,16),
  type: "練習試合",
  opponent: "",
  venue: "",
  goalsFor: "",
  goalsAgainst: "",
  mvp: "",
  notes: "",
  formation: formation,
  lineup: FORMATIONS[formation].reduce((acc,k)=> (acc[k]="", acc), {}),
  photos: [],
  youtubeUrl: "",
  substitutions: [],
  isMultiMatch: false,
  subMatches: [],
});

const MatchSection = ({
  players,
  match,
  setMatch,
  saveMatch,
  teamId = 'default',
  uniforms = { fpHome:'', fpAway:'', gk:'' }
}) => {
  const [newPhoto, setNewPhoto] = useState("");
  const [newSubstitution, setNewSubstitution] = useState({ minute: "", out: "", in: "", reason: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const playerOptions = players
    .slice()
    .sort((a,b)=>(a.number||0) - (b.number||0))
    .map(p => ({ value: p.id, label: p.number ? `#${p.number} ${p.name}` : p.name }));

  const setField = (k, v) => setMatch(m => ({ ...m, [k]: v }));

  const changeFormation = (newFormation) => {
    const newLineup = FORMATIONS[newFormation].reduce((acc, pos) => {
      acc[pos] = match.lineup[pos] || "";
      return acc;
    }, {});
    setMatch(m => ({ ...m, formation: newFormation, lineup: newLineup }));
  };

  // 写真関連ハンドラー
  const addPhoto = () => {
    if (!newPhoto.trim()) return;
    setMatch(m => ({...m, photos: [...(m.photos || []), newPhoto.trim()]}));
    setNewPhoto("");
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setMatch(m => ({...m, photos: [...(m.photos || []), base64]}));
        setUploading(false);
      };
      reader.onerror = () => {
        alert('ファイルの読み込みに失敗しました');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('ファイルのアップロードに失敗しました');
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removePhoto = (index) => {
    setMatch(m => ({...m, photos: m.photos.filter((_, i) => i !== index)}));
  };

  // 交代関連ハンドラー
  const addSubstitution = () => {
    if (!newSubstitution.minute || !newSubstitution.out || !newSubstitution.in) {
      alert("交代時間、OUT選手、IN選手を入力してください");
      return;
    }
    const substitution = {
      id: crypto.randomUUID(),
      minute: parseInt(newSubstitution.minute),
      out: newSubstitution.out,
      in: newSubstitution.in,
      reason: newSubstitution.reason || ""
    };
    setMatch(m => ({...m, substitutions: [...(m.substitutions || []), substitution]}));
    setNewSubstitution({ minute: "", out: "", in: "", reason: "" });
  };

  const removeSubstitution = (id) => {
    setMatch(m => ({...m, substitutions: m.substitutions.filter(s => s.id !== id)}));
  };

  const toggleMultiMatch = () => {
    setMatch(m => ({...m, isMultiMatch: !m.isMultiMatch, subMatches: []}));
  };

  const addSubMatch = () => {
    const subMatch = {
      id: crypto.randomUUID(),
      matchNumber: (match.subMatches?.length || 0) + 1,
      goalsFor: "",
      goalsAgainst: "",
      lineup: {...match.lineup},
      substitutions: []
    };
    setMatch(m => ({...m, subMatches: [...(m.subMatches || []), subMatch]}));
  };

  const handleSaveMatch = () => {
    const noGK = !match.lineup.GK;
    if (noGK) {
      alert("GK が未選択です");
      return;
    }
    saveMatch();
  };

  return (
    <div className="stack">
      {/* 基本情報 */}
      <section className="card">
        <h2>⚽ 試合記録</h2>

        <div className="row-3">
          <div>
            <label>日時</label>
            <input type="datetime-local" value={match.date} onChange={e=>setField("date", e.target.value)} />
          </div>
          <div>
            <label>種別</label>
            <select value={match.type} onChange={e=>setField("type", e.target.value)}>
              <option>練習試合</option>
              <option>公式戦</option>
              <option>招待/カップ戦</option>
            </select>
          </div>
          <div>
            <label>対戦相手</label>
            <input value={match.opponent} onChange={e=>setField("opponent", e.target.value)} placeholder="相手チーム" />
          </div>
        </div>

        <div className="row-3" style={{marginTop:8}}>
          <div>
            <label>会場</label>
            <input value={match.venue} onChange={e=>setField("venue", e.target.value)} placeholder="○○グラウンド" />
          </div>
          <div>
            <label>得点</label>
            <input value={match.goalsFor} onChange={e=>setField("goalsFor", e.target.value)} placeholder="2" />
          </div>
          <div>
            <label>失点</label>
            <input value={match.goalsAgainst} onChange={e=>setField("goalsAgainst", e.target.value)} placeholder="1" />
          </div>
        </div>

        <div className="row-3" style={{marginTop:8}}>
          <div>
            <label>MVP</label>
            <input value={match.mvp} onChange={e=>setField("mvp", e.target.value)} placeholder="選手名 or 背番号" />
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label>試合メモ</label>
            <textarea value={match.notes} onChange={e=>setField("notes", e.target.value)} placeholder="良かった点・課題など" />
          </div>
        </div>
      </section>

      {/* 写真・動画 */}
      <section className="card">
        <h3>📷 写真・動画</h3>

        <div style={{marginBottom:12}}>
          <label>YouTube動画URL</label>
          <input
            value={match.youtubeUrl || ""}
            onChange={e=>setField("youtubeUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label>写真追加</label>
          <div className="row" style={{gap: 8, marginBottom: 12}}>
            <input
              value={newPhoto}
              onChange={e=>setNewPhoto(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            <button className="primary" onClick={addPhoto} style={{whiteSpace: 'nowrap'}}>
              URL追加
            </button>
          </div>

          <div style={{marginBottom: 12}}>
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
              <label style={{
                display: 'inline-block',
                padding: '12px 16px',
                background: 'var(--brand)',
                color: 'white',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '14px',
                border: 'none'
              }}>
                📁 ファイル選択
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>

              <label style={{
                display: 'inline-block',
                padding: '12px 16px',
                background: 'var(--brand)',
                color: 'white',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '14px',
                border: 'none'
              }}>
                📷 カメラ撮影
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>

              {uploading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--ink-2)',
                  fontSize: '14px'
                }}>
                  ⏳ アップロード中...
                </div>
              )}
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${isDragOver ? 'var(--brand)' : 'var(--line)'}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: isDragOver ? '#f0f9f0' : '#f8f9fa',
              color: 'var(--ink-2)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 12
            }}
          >
            {isDragOver ? (
              <>📤 ここにドロップしてください</>
            ) : (
              <>🖼️ ここに画像をドラッグ&ドロップ<br/>（またはクリックしてファイル選択）</>
            )}
          </div>

          {match.photos && match.photos.length > 0 && (
            <div style={{marginTop: 8}}>
              <div className="kicker" style={{marginBottom: 4}}>登録済み写真:</div>
              <div className="list">
                {match.photos.map((photo, index) => (
                  <div key={index} style={{
                    padding: "8px 12px",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8, flex: 1}}>
                      {photo.startsWith('data:image/') ? (
                        <img
                          src={photo}
                          alt="プレビュー"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            border: '1px solid var(--line)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          background: 'var(--line)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          🔗
                        </div>
                      )}
                      <span style={{
                        fontSize: "12px",
                        wordBreak: "break-all",
                        flex: 1,
                        color: photo.startsWith('data:image/') ? 'var(--ink-2)' : 'var(--ink)'
                      }}>
                        {photo.startsWith('data:image/') ?
                          `画像ファイル (${Math.round(photo.length / 1024)}KB)` :
                          photo
                        }
                      </span>
                    </div>
                    <button
                      className="ghost"
                      style={{padding: "4px 8px", fontSize: "12px"}}
                      onClick={() => removePhoto(index)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* フォーメーション・メンバー */}
      <section className="card">
        <h3>👥 スターティングメンバー</h3>

        <div style={{marginBottom:12}}>
          <label>フォーメーション</label>
          <select
            value={match.formation || "4-4-2"}
            onChange={e => changeFormation(e.target.value)}
            style={{maxWidth:"200px"}}
          >
            {Object.keys(FORMATIONS).map(formation => (
              <option key={formation} value={formation}>{formation}</option>
            ))}
          </select>
        </div>

        <div className="lineup" style={{marginTop:8}}>
          {FORMATIONS[match.formation || "4-4-2"].map(pos => (
            <div key={pos}>
              <label>{pos}</label>
              <select
                value={match.lineup[pos] || ""}
                onChange={(e)=>{
                  const val = e.target.value;
                  setMatch(m => ({...m, lineup: {...m.lineup, [pos]: val }}));
                }}
              >
                <option value="">未選択</option>
                {playerOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <UniformPicker teamId={teamId} />

        <div className="rounded-xl bg-white/50 p-3 mt-3">
          <h4 style={{fontSize: '14px', marginBottom: '8px'}}>フォーメーション視覚化</h4>
          <FormationPitch
            formation={match.formation || '4-4-2'}
            players={Object.values(match.lineup || {}).map(playerId => {
              if (!playerId) return null;
              const player = players.find(p => p.id === playerId);
              return player ? { name: player.name, id: player.id } : null;
            })}
            teamUniforms={uniforms}
            useAway={false}
          />
        </div>
      </section>

      {/* 交代履歴 */}
      <section className="card">
        <h3>🔄 交代履歴</h3>

        <div className="row-3" style={{gap: 8, marginBottom: 12}}>
          <div>
            <label>時間（分）</label>
            <input
              type="number"
              value={newSubstitution.minute}
              onChange={e=>setNewSubstitution(prev => ({...prev, minute: e.target.value}))}
              placeholder="45"
              min="0"
              max="120"
            />
          </div>
          <div>
            <label>OUT選手</label>
            <select
              value={newSubstitution.out}
              onChange={e=>setNewSubstitution(prev => ({...prev, out: e.target.value}))}
            >
              <option value="">選択...</option>
              {playerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>IN選手</label>
            <select
              value={newSubstitution.in}
              onChange={e=>setNewSubstitution(prev => ({...prev, in: e.target.value}))}
            >
              <option value="">選択...</option>
              {playerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{marginBottom: 12}}>
          <label>交代理由（任意）</label>
          <input
            value={newSubstitution.reason}
            onChange={e=>setNewSubstitution(prev => ({...prev, reason: e.target.value}))}
            placeholder="戦術変更、怪我、疲労など"
          />
        </div>

        <div className="actions" style={{marginBottom: 12}}>
          <button className="primary" onClick={addSubstitution}>
            交代を記録
          </button>
        </div>

        {match.substitutions && match.substitutions.length > 0 && (
          <div>
            <div className="kicker" style={{marginBottom: 8}}>交代履歴:</div>
            <div className="list">
              {match.substitutions
                .sort((a, b) => a.minute - b.minute)
                .map(sub => {
                  const outPlayer = players.find(p => p.id === sub.out);
                  const inPlayer = players.find(p => p.id === sub.in);
                  return (
                    <div key={sub.id} style={{
                      padding: "8px 12px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div style={{flex: 1}}>
                        <strong>{sub.minute}分</strong>
                        <span style={{margin: "0 8px"}}>
                          ⬅️ {outPlayer ? (outPlayer.num ? `#${outPlayer.num} ${outPlayer.name}` : outPlayer.name) : "不明"}
                        </span>
                        <span style={{margin: "0 8px"}}>
                          ➡️ {inPlayer ? (inPlayer.num ? `#${inPlayer.num} ${inPlayer.name}` : inPlayer.name) : "不明"}
                        </span>
                        {sub.reason && (
                          <div className="kicker" style={{marginTop: 2}}>
                            理由: {sub.reason}
                          </div>
                        )}
                      </div>
                      <button
                        className="ghost"
                        style={{padding: "4px 8px", fontSize: "12px"}}
                        onClick={() => removeSubstitution(sub.id)}
                      >
                        削除
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      {/* 練習試合用の複数試合記録 */}
      {match.type === "練習試合" && (
        <section className="card">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <h3 style={{fontSize: '16px', margin: 0}}>⚽ 複数試合記録</h3>
            <label style={{display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={match.isMultiMatch || false}
                onChange={toggleMultiMatch}
              />
              <span style={{fontSize: '14px'}}>複数試合を記録</span>
            </label>
          </div>

          {match.isMultiMatch && (
            <>
              <div className="actions" style={{marginBottom: 12}}>
                <button className="primary" onClick={addSubMatch}>
                  試合を追加
                </button>
                <span className="kicker">
                  {match.subMatches?.length || 0}試合記録済み
                </span>
              </div>

              {match.subMatches && match.subMatches.length > 0 && (
                <div className="list">
                  {match.subMatches.map((subMatch, index) => (
                    <div key={subMatch.id} style={{
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                        <strong>第{subMatch.matchNumber}試合</strong>
                        <button
                          className="ghost"
                          style={{padding: "4px 8px", fontSize: "12px"}}
                          onClick={() => {
                            setMatch(m => ({
                              ...m,
                              subMatches: m.subMatches.filter(sm => sm.id !== subMatch.id)
                            }));
                          }}
                        >
                          削除
                        </button>
                      </div>
                      <div className="row-3" style={{gap: 8}}>
                        <div>
                          <label>得点</label>
                          <input
                            value={subMatch.goalsFor}
                            onChange={e => {
                              setMatch(m => ({
                                ...m,
                                subMatches: m.subMatches.map(sm =>
                                  sm.id === subMatch.id ? {...sm, goalsFor: e.target.value} : sm
                                )
                              }));
                            }}
                            placeholder="2"
                          />
                        </div>
                        <div>
                          <label>失点</label>
                          <input
                            value={subMatch.goalsAgainst}
                            onChange={e => {
                              setMatch(m => ({
                                ...m,
                                subMatches: m.subMatches.map(sm =>
                                  sm.id === subMatch.id ? {...sm, goalsAgainst: e.target.value} : sm
                                )
                              }));
                            }}
                            placeholder="1"
                          />
                        </div>
                        <div style={{display: 'flex', alignItems: 'end'}}>
                          <span className="kicker">
                            {subMatch.goalsFor || 0} - {subMatch.goalsAgainst || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* 保存ボタン */}
      <section className="card">
        <div className="actions">
          <button className="primary" onClick={handleSaveMatch}>試合を保存</button>
          <button className="ghost" onClick={()=> window.print()}>印刷</button>
        </div>
      </section>
    </div>
  );
};

export default MatchSection;
export { emptyMatch, FORMATIONS };