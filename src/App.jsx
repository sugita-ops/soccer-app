import { ui } from "./ui";
import React, { useEffect, useMemo, useState } from "react";

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
  date: new Date().toISOString().slice(0,16),  // yyyy-mm-ddThh:mm
  type: "練習試合",
  opponent: "",
  venue: "",
  goalsFor: "",
  goalsAgainst: "",
  mvp: "",
  notes: "",
  formation: formation,
  lineup: FORMATIONS[formation].reduce((acc,k)=> (acc[k]="", acc), {}),
  // 新機能用フィールド
  photos: [], // 写真URL配列
  youtubeUrl: "", // YouTubeリンク
  substitutions: [], // 交代履歴 [{minute: 45, out: "playerId", in: "playerId", reason: "戦術変更"}]
  // 練習試合用複数試合記録
  isMultiMatch: false, // 練習試合で複数試合記録するかのフラグ
  subMatches: [], // 複数試合の場合のサブ試合 [{matchNumber: 1, goalsFor: 2, goalsAgainst: 1, lineup: {}, substitutions: []}]
});

const useLocal = (key, initial) => {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(()=> localStorage.setItem(key, JSON.stringify(v)), [key, v]);
  return [v, setV];
};

export default function App() {
  // ログイン管理
  const [user, setUser] = useLocal("currentUser", null);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // ユーザー管理
  const [users, setUsers] = useLocal("systemUsers", [
    { id: "admin", password: "miyachu2024", role: "admin", name: "管理者", createdAt: "2024-01-01" },
    { id: "coach", password: "soccer123", role: "coach", name: "コーチ", createdAt: "2024-01-01" },
    { id: "parent", password: "supporter", role: "parent", name: "保護者", createdAt: "2024-01-01" }
  ]);

  // パスワード生成関数
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const login = () => {
    const foundUser = users.find(u => u.id === loginId && u.password === loginPw);
    if (foundUser) {
      setUser({ id: foundUser.id, name: foundUser.name, role: foundUser.role });
      setLoginId(""); setLoginPw("");
    } else {
      alert("IDまたはパスワードが間違っています");
    }
  };

  // ユーザー管理機能
  const [newUser, setNewUser] = useState({ id: "", name: "", role: "parent" });

  // 新機能用の状態
  const [newPhoto, setNewPhoto] = useState("");
  const [newSubstitution, setNewSubstitution] = useState({ minute: "", out: "", in: "", reason: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addUser = () => {
    if (!newUser.id.trim() || !newUser.name.trim()) {
      alert("IDと名前を入力してください");
      return;
    }
    if (users.find(u => u.id === newUser.id.trim())) {
      alert("このIDは既に使用されています");
      return;
    }

    const password = generatePassword();
    const newUserData = {
      id: newUser.id.trim(),
      name: newUser.name.trim(),
      role: newUser.role,
      password: password,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setUsers(prev => [...prev, newUserData]);
    alert(`ユーザーを作成しました\nID: ${newUserData.id}\nパスワード: ${password}\n※パスワードを安全に保管してください`);
    setNewUser({ id: "", name: "", role: "parent" });
  };

  const deleteUser = (userId) => {
    if (userId === "admin") {
      alert("管理者アカウントは削除できません");
      return;
    }
    if (confirm(`ユーザー「${userId}」を削除しますか？`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // 新機能用のハンドラー関数
  const addPhoto = () => {
    if (!newPhoto.trim()) return;
    setMatch(m => ({...m, photos: [...(m.photos || []), newPhoto.trim()]}));
    setNewPhoto("");
  };

  // ファイルをBase64に変換してphotosに追加
  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB制限
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

  // ドラッグ&ドロップハンドラー
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

  // ファイル選択ハンドラー
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removePhoto = (index) => {
    setMatch(m => ({...m, photos: m.photos.filter((_, i) => i !== index)}));
  };

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

  const logout = () => setUser(null);

  // コメント管理
  const [comments, setComments] = useLocal("comments", []);
  const [newComment, setNewComment] = useState("");

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      author: user.name,
      timestamp: new Date().toLocaleString("ja-JP")
    };
    setComments(prev => [comment, ...prev]);
    setNewComment("");
  };

  // 選手管理
  const [players, setPlayers] = useLocal("players", []);
  const [name, setName] = useState("");
  const [num, setNum] = useState("");

  const addPlayer = () => {
    if(!name.trim()) return;
    setPlayers(p => [...p, { id: crypto.randomUUID(), name: name.trim(), num: num.trim() }]);
    setName(""); setNum("");
  };
  const playerOptions = useMemo(
    () => players
      .slice()
      .sort((a,b)=>(a.num||"").localeCompare(b.num||"", "ja", { numeric:true }))
      .map(p => ({ value: p.id, label: p.num ? `#${p.num} ${p.name}` : p.name })),
    [players]
  );

  // 試合情報
  const [match, setMatch] = useState(()=> emptyMatch());
  const [matches, setMatches] = useLocal("matches", []);
  const setField = (k, v) => setMatch(m => ({ ...m, [k]: v }));

  const changeFormation = (newFormation) => {
    const newLineup = FORMATIONS[newFormation].reduce((acc, pos) => {
      // 既存の選手がいる場合は保持、なければ空文字
      acc[pos] = match.lineup[pos] || "";
      return acc;
    }, {});
    setMatch(m => ({ ...m, formation: newFormation, lineup: newLineup }));
  };

  const saveMatch = () => {
    // 簡易バリデーション
    const noGK = !match.lineup.GK;
    if (noGK) { alert("GK が未選択です"); return; }
    setMatches(m => [ { ...match }, ...m ]);
    setMatch(emptyMatch(match.formation));
  };

  // ログインしていない場合のUI
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-logo">⚽</div>
          <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>宮中サッカー部</h1>
          <p style={{color: 'var(--ink-2)', marginBottom: '32px'}}>管理システムにログイン</p>

          <div className="stack">
            <div>
              <label>ユーザーID</label>
              <input
                value={loginId}
                onChange={e=>setLoginId(e.target.value)}
                placeholder="ID を入力"
              />
            </div>
            <div>
              <label>パスワード</label>
              <input
                type="password"
                value={loginPw}
                onChange={e=>setLoginPw(e.target.value)}
                placeholder="パスワードを入力"
                onKeyPress={e => e.key === 'Enter' && login()}
              />
            </div>
            <button className="primary" onClick={login} style={{width: '100%', marginTop: '8px'}}>
              ログイン
            </button>
          </div>

          <div style={{marginTop: "24px", padding: "16px", background: "#f8f9fa", borderRadius: "12px"}}>
            <div className="kicker" style={{marginBottom: '8px', fontWeight: 'bold'}}>利用可能なアカウント:</div>
            <div style={{fontSize: "12px", lineHeight: '1.5'}}>
              <div>🔧 <strong>admin</strong> / miyachu2024（管理者）</div>
              <div>👨‍🏫 <strong>coach</strong> / soccer123（コーチ）</div>
              <div>👨‍👩‍👧‍👦 <strong>parent</strong> / supporter（保護者）</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden rounded-2xl shadow-sm bg-white mb-6">
        <img
          src="/img/miyachu-header.png"
          alt="宮中サッカー部"
          className="block mx-auto w-full h-auto max-h-[360px] sm:max-h-[420px] md:max-h-[500px] object-contain"
        />
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent text-white p-6">
          <h1 className="text-2xl md:text-3xl font-semibold">⚽ 行け！宮中サッカー部</h1>
          <p className="opacity-90">チーム管理システム</p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <span>ようこそ、{user.name}さん</span>
            <button className="ghost" onClick={logout} style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white'}}>
              ログアウト
            </button>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* メインコンテンツエリア */}
        <div className="stack">
          {/* 試合記録 */}
          <section className="card-enhanced">
          <h2>試合記録</h2>

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

          {/* 新機能: 写真とYouTubeリンク */}
          <div className="stack" style={{marginTop:12}}>
            <div className="card" style={{padding:12}}>
              <h3 style={{fontSize: '16px', marginBottom: '12px'}}>📷 写真・動画</h3>

              {/* YouTube リンク */}
              <div style={{marginBottom:12}}>
                <label>YouTube動画URL</label>
                <input
                  value={match.youtubeUrl || ""}
                  onChange={e=>setField("youtubeUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* 写真 */}
              <div>
                <label>写真追加</label>

                {/* URL入力 */}
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

                {/* ファイルアップロード */}
                <div style={{marginBottom: 12}}>
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                    {/* ファイル選択ボタン */}
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

                    {/* カメラ撮影ボタン（スマホ用） */}
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

                {/* ドラッグ&ドロップエリア */}
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
                            {/* 画像プレビュー */}
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
            </div>
          </div>

          <div className="stack" style={{marginTop:12}}>
            <div className="card" style={{padding:12}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                <strong>スターティングメンバー（{match.formation || "4-4-2"}）</strong>
                <span className="kicker">{playerOptions.length}人から選択</span>
              </div>

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
            </div>

            {/* 交代履歴セクション */}
            <div className="card" style={{padding:12}}>
              <h3 style={{fontSize: '16px', marginBottom: '12px'}}>🔄 交代履歴</h3>

              {/* 交代登録 */}
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

              {/* 交代履歴一覧 */}
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
            </div>

            {/* 練習試合用の複数試合記録 */}
            {match.type === "練習試合" && (
              <div className="card" style={{padding:12}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                  <h3 style={{fontSize: '16px', margin: 0}}>⚽ 練習試合（複数試合記録）</h3>
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
              </div>
            )}

            <div className="actions">
              <button className="primary" onClick={saveMatch}>試合を保存</button>
              <button className="ghost" onClick={()=>{
                const data = JSON.stringify(matches, null, 2);
                const blob = new Blob([data], {type:"application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "matches.json"; a.click();
                URL.revokeObjectURL(url);
              }}>JSON書き出し</button>
              <button className="ghost" onClick={()=> window.print()}>印刷</button>
            </div>
          </div>
        </section>

          {/* 選手登録・管理 */}
          <section className="card-enhanced">
          <h2>選手登録・管理</h2>
          <div className="row">
            <div>
              <label>選手名</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="例）佐藤 太郎" />
            </div>
            <div>
              <label>背番号</label>
              <input value={num} onChange={e=>setNum(e.target.value)} placeholder="10" />
            </div>
          </div>
          <div className="actions" style={{marginTop:8}}>
            <button className="primary" onClick={addPlayer}>追加</button>
            <button className="ghost" onClick={()=>{
              const data = JSON.stringify(players, null, 2);
              const blob = new Blob([data], {type:"application/json"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "players.json"; a.click();
              URL.revokeObjectURL(url);
            }}>選手データ書き出し</button>
            <span className="kicker">登録人数：{players.length}人</span>
          </div>

          {players.length > 0 && (
            <div style={{marginTop:12}}>
              <div className="list">
                {playerOptions.map(p => (
                  <div key={p.value} style={{padding:"8px 12px", background:"#f8f9fa", borderRadius:"8px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <span>{p.label}</span>
                    <button
                      className="ghost"
                      style={{padding:"4px 8px", fontSize:"12px"}}
                      onClick={()=> setPlayers(prev => prev.filter(pl => pl.id !== p.value))}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

          {/* 試合履歴 */}
          <section className="card-enhanced">
          <h2>試合履歴</h2>
          {matches.length === 0 ? (
            <div className="kicker">保存された試合はまだありません。</div>
          ) : (
            <div className="list">
              {matches.map(m => (
                <article key={m.id} className="match">
                  <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
                    <span className="badge">{m.type}</span>
                    <strong>{(m.date||"").replace("T"," ")} / vs {m.opponent||"-"} @ {m.venue||"-"}</strong>
                    {/* 複数試合記録の場合は集計表示 */}
                    {m.isMultiMatch && m.subMatches?.length > 0 ? (
                      <span>｜{m.subMatches.length}試合 ({
                        m.subMatches.map((sm, i) => `${sm.goalsFor||0}-${sm.goalsAgainst||0}`).join(", ")
                      })</span>
                    ) : (
                      <span>｜{m.goalsFor||0} - {m.goalsAgainst||0}</span>
                    )}
                    <span>｜{m.formation || "4-4-2"}</span>
                    {m.mvp && <span>｜MVP: {m.mvp}</span>}
                  </div>
                  {m.notes && <div style={{marginTop:6}} className="kicker">{m.notes}</div>}

                  {/* YouTube動画リンク */}
                  {m.youtubeUrl && (
                    <div style={{marginTop: 6}}>
                      <a
                        href={m.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--brand)',
                          textDecoration: 'none',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        🎥 YouTube動画を見る
                      </a>
                    </div>
                  )}

                  {/* 写真表示 */}
                  {m.photos && m.photos.length > 0 && (
                    <div style={{marginTop: 6}}>
                      <div className="kicker" style={{marginBottom: 4}}>写真:</div>
                      <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                        {m.photos.slice(0, 3).map((photo, index) => (
                          photo.startsWith('data:image/') ? (
                            <img
                              key={index}
                              src={photo}
                              alt={`写真${index + 1}`}
                              style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '6px',
                                objectFit: 'cover',
                                border: '1px solid var(--line)',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                // 画像を新しいタブで開く
                                const newWindow = window.open();
                                newWindow.document.write(`<img src="${photo}" style="max-width:100%;max-height:100%;">`);
                              }}
                            />
                          ) : (
                            <a
                              key={index}
                              href={photo}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '12px',
                                color: 'var(--brand)',
                                textDecoration: 'none'
                              }}
                            >
                              📷 写真{index + 1}
                            </a>
                          )
                        ))}
                        {m.photos.length > 3 && (
                          <span className="kicker" style={{fontSize: '12px'}}>
                            他{m.photos.length - 3}枚
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 交代履歴 */}
                  {m.substitutions && m.substitutions.length > 0 && (
                    <div style={{marginTop: 6}}>
                      <div className="kicker" style={{marginBottom: 4}}>交代:</div>
                      <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                        {m.substitutions
                          .sort((a, b) => a.minute - b.minute)
                          .map((sub, index) => {
                            const outPlayer = players.find(p => p.id === sub.out);
                            const inPlayer = players.find(p => p.id === sub.in);
                            return (
                              <div key={sub.id || index} style={{marginBottom: 2}}>
                                {sub.minute}分: {outPlayer ? (outPlayer.num ? `#${outPlayer.num} ${outPlayer.name}` : outPlayer.name) : "不明"}
                                {" → "}
                                {inPlayer ? (inPlayer.num ? `#${inPlayer.num} ${inPlayer.name}` : inPlayer.name) : "不明"}
                                {sub.reason && ` (${sub.reason})`}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <footer>
                    先発:{" "}
                    {(FORMATIONS[m.formation || "4-4-2"] || FORMATIONS["4-4-2"]).map(k=>{
                      const pid = m.lineup?.[k];
                      const player = players.find(p=>p.id===pid);
                      return <span key={k}>{k}:{player? (player.num?`#${player.num} ${player.name}`:player.name):"-"}　</span>;
                    })}
                  </footer>
                </article>
              ))}
            </div>
          )}
          </section>

          {/* ユーザー管理 - 管理者専用 */}
          {user?.role === "admin" && (
            <section className="card-enhanced">
              <h2>🔐 ユーザー管理（管理者専用）</h2>

              {/* 新規ユーザー作成 */}
              <div style={{marginBottom: 24}}>
                <h3 style={{fontSize: '16px', marginBottom: '12px'}}>新規ユーザー作成</h3>
                <div className="row-3">
                  <div>
                    <label>ユーザーID</label>
                    <input
                      value={newUser.id}
                      onChange={e => setNewUser(prev => ({...prev, id: e.target.value}))}
                      placeholder="例）tanaka"
                    />
                  </div>
                  <div>
                    <label>名前</label>
                    <input
                      value={newUser.name}
                      onChange={e => setNewUser(prev => ({...prev, name: e.target.value}))}
                      placeholder="例）田中太郎"
                    />
                  </div>
                  <div>
                    <label>役割</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser(prev => ({...prev, role: e.target.value}))}
                    >
                      <option value="parent">保護者</option>
                      <option value="coach">コーチ</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>
                </div>
                <div className="actions" style={{marginTop: 12}}>
                  <button className="primary" onClick={addUser}>ユーザー作成</button>
                  <span className="kicker">※パスワードは自動生成されます</span>
                </div>
              </div>

              {/* ユーザー一覧 */}
              <div>
                <h3 style={{fontSize: '16px', marginBottom: '12px'}}>登録ユーザー一覧</h3>
                <div className="list">
                  {users.map(u => (
                    <div key={u.id} style={{
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div><strong>{u.name}</strong> ({u.id})</div>
                        <div className="kicker">
                          役割: {u.role === 'admin' ? '管理者' : u.role === 'coach' ? 'コーチ' : '保護者'} |
                          作成日: {u.createdAt}
                        </div>
                      </div>
                      <div className="actions">
                        <button
                          className="ghost"
                          style={{padding: "4px 8px", fontSize: "12px"}}
                          onClick={() => deleteUser(u.id)}
                          disabled={u.id === "admin"}
                        >
                          {u.id === "admin" ? "削除不可" : "削除"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="actions" style={{marginTop: 12}}>
                  <button className="ghost" onClick={() => {
                    const data = JSON.stringify(users, null, 2);
                    const blob = new Blob([data], {type: "application/json"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "users.json"; a.click();
                    URL.revokeObjectURL(url);
                  }}>ユーザーデータ書き出し</button>
                  <span className="kicker">登録ユーザー数：{users.length}人</span>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 応援コメント - サイドバー */}
        <div className="comments-sidebar">
          <h2>🎉 応援コメント</h2>

          <div className="stack">
            <div>
              <div style={{display: "flex", gap: "8px", alignItems: "flex-end"}}>
                <div style={{flex: 1}}>
                  <label>応援メッセージ</label>
                  <textarea
                    value={newComment}
                    onChange={e=>setNewComment(e.target.value)}
                    placeholder="頑張れ！宮中サッカー部！"
                    style={{minHeight: "60px"}}
                  />
                </div>
                <button className="primary" onClick={addComment}>投稿</button>
              </div>
            </div>

            {comments.length === 0 ? (
              <div className="kicker">まだコメントがありません。最初の応援メッセージを投稿しましょう！</div>
            ) : (
              <div className="list">
                {comments.map(comment => (
                  <div key={comment.id} style={{
                    padding: "12px",
                    background: "#f8fffe",
                    border: "1px solid #e6f7f5",
                    borderRadius: "8px"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "6px"
                    }}>
                      <strong style={{color: "#16a34a"}}>{comment.author}</strong>
                      <span className="kicker">{comment.timestamp}</span>
                    </div>
                    <div>{comment.text}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <button className="ghost" onClick={()=>{
                const data = JSON.stringify(comments, null, 2);
                const blob = new Blob([data], {type:"application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "comments.json"; a.click();
                URL.revokeObjectURL(url);
              }}>コメント書き出し</button>
              <span className="kicker">コメント数：{comments.length}件</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
