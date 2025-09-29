import React, { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthContainer from './components/Auth/AuthContainer';
import { loadJSON, saveJSON, exportJSON, importJSON, uid } from './lib/jsonStore';
import { syncWithCloud, savePlayersToCloud, syncFromCloudUpsert } from './lib/cloudSync';
import PlayerImport from './components/PlayerImport';
import { useToast, ToastContainer } from './components/Toast';
import UniformPicker from './components/UniformPicker';
import FormationPitch from './components/FormationPitch';
import DataMigration from './components/DataMigration';
import InvitationManager from './components/InvitationManager';
import StadiumVisionDisplay from './components/StadiumVisionDisplay';
import PlayerStatistics from './components/PlayerStatistics';
import TeamCustomization from './components/TeamCustomization';
import { isSupabaseAvailable } from './lib/supabase';
import OriginalApp from './App';

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

function SoccerApp() {
  const { user, profile, loading, logout } = useAuth();
  const toast = useToast();

  // 新機能用の状態
  const [newPhoto, setNewPhoto] = useState("");
  const [newSubstitution, setNewSubstitution] = useState({ minute: "", out: "", in: "", reason: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // コメント管理
  const [comments, setComments] = useLocal("comments", []);
  const [newComment, setNewComment] = useState("");

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      author: profile?.name || user?.email || 'Unknown',
      timestamp: new Date().toLocaleString("ja-JP")
    };
    setComments(prev => [comment, ...prev]);
    setNewComment("");
  };

  // 選手管理 - jsonStoreと統一
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [num, setNum] = useState("");

  // 選手データをjsonStoreから読み込み
  useEffect(() => {
    const data = loadJSON();
    setPlayers(data.players || []);
  }, []);

  // 選手データを更新する関数
  const refreshPlayers = () => {
    const data = loadJSON();
    setPlayers(data.players || []);
  };

  // スタジアムビジョン表示状態
  const [visionMatch, setVisionMatch] = useState(null);

  // クラウド同期状態
  const [cloudPassword, setCloudPassword] = useState("");
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // ユニフォーム状態
  const [teamId] = useState('default');
  const [uniforms, setUniforms] = useState({ fpHome:'', fpAway:'', gk:'' });

  // ユニフォーム読み込み
  useEffect(() => {
    const data = loadJSON();
    const saved = data.teamUniforms?.[teamId] || {};
    setUniforms({ fpHome: saved.fpHome || '', fpAway: saved.fpAway || '', gk: saved.gk || '' });
  }, [teamId]);

  // 起動時にクラウドから同期とチーム設定読み込み
  useEffect(() => {
    const performInitialSync = async () => {
      try {
        const result = await syncWithCloud();
        if (result.success && result.action === 'imported') {
          refreshPlayers();
          toast.success(result.message);
        }
      } catch (error) {
        console.warn('初期同期失敗:', error);
      }
    };

    // チーム設定を読み込んでテーマを適用
    const loadTeamTheme = async () => {
      try {
        const { getTeamSettings, applyThemeColors } = await import('./lib/teamSettings');
        const { data } = await getTeamSettings();
        if (data) {
          applyThemeColors(data.primary_color, data.secondary_color);
        }
      } catch (error) {
        console.warn('チーム設定読み込み失敗:', error);
      }
    };

    // ネイティブ機能の初期化
    const initializeNativeFeatures = async () => {
      try {
        const {
          configureStatusBar,
          hideSplashScreen,
          setupAppStateListeners,
          setupBackButtonHandler
        } = await import('./lib/nativeFeatures');

        await configureStatusBar();
        await hideSplashScreen();

        // アプリ状態監視
        setupAppStateListeners({
          onStateChange: (state) => {
            console.log('App state changed:', state);
          }
        });

        // バックボタン処理
        setupBackButtonHandler(({ canGoBack }) => {
          if (!canGoBack) {
            // アプリを最小化
            import('@capacitor/app').then(({ App }) => {
              App.minimizeApp();
            }).catch(() => {
              // Web環境では何もしない
            });
          }
        });

      } catch (error) {
        console.warn('ネイティブ機能初期化失敗:', error);
      }
    };

    performInitialSync();
    loadTeamTheme();
    initializeNativeFeatures();
  }, []);

  // クラウドに保存
  const handleCloudSave = async () => {
    if (!cloudPassword.trim()) {
      toast.error("保存パスワードを入力してください");
      return;
    }

    setIsCloudLoading(true);

    try {
      const db = loadJSON();
      const result = await savePlayersToCloud(db.players, cloudPassword);

      if (result.success) {
        toast.success(result.message);
        setCloudPassword(""); // パスワードをクリア
      } else {
        toast.error(result.error || "保存に失敗しました");
      }
    } catch (error) {
      toast.error("ネットワークエラーまたは認証失敗");
    } finally {
      setIsCloudLoading(false);
    }
  };

  // クラウドから読み込み
  const handleCloudLoad = async () => {
    setIsCloudLoading(true);

    try {
      const result = await syncWithCloud();

      if (result.success) {
        if (result.action === 'imported') {
          refreshPlayers();
          toast.success(result.message);
        } else if (result.action === 'no_change') {
          toast.info("ローカルデータが最新です");
        }
      } else {
        toast.error(result.error || "読み込みに失敗しました");
      }
    } catch (error) {
      toast.error("ネットワークエラーが発生しました");
    } finally {
      setIsCloudLoading(false);
    }
  };

  // 今すぐ同期（アップサート）
  const handleSyncNow = async () => {
    setIsCloudLoading(true);

    try {
      const result = await syncFromCloudUpsert();

      if (result.success) {
        refreshPlayers();
        if (result.action === 'upserted') {
          toast.success(result.message);
        } else if (result.action === 'no_data') {
          toast.info(result.message);
        }
      } else {
        toast.error(result.error || "同期に失敗しました");
      }
    } catch (error) {
      toast.error("ネットワークエラーが発生しました");
    } finally {
      setIsCloudLoading(false);
    }
  };

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

    // UI を更新
    refreshPlayers();
    setName("");
    setNum("");
  };

  const playerOptions = useMemo(
    () => players
      .slice()
      .sort((a,b)=>(a.number||0) - (b.number||0))
      .map(p => ({ value: p.id, label: p.number ? `#${p.number} ${p.name}` : p.name })),
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

  // 認証待機中
  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-logo">⚽</div>
          <div style={{textAlign: 'center', color: 'var(--ink-2)'}}>
            読み込み中...
          </div>
        </div>
      </div>
    );
  }

  // 未認証時
  if (!user) {
    return <AuthContainer />;
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
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
              <span>ようこそ、{profile?.name || user.email}さん</span>
              <button
                className="ghost"
                onClick={()=>{ const cur=loadJSON(); saveJSON(cur); alert('保存しました'); }}
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px'}}
              >
                保存
              </button>
              <button
                className="ghost"
                onClick={()=>{ const cur=loadJSON(); alert('読み込み完了\n' + Object.keys(cur).join(', ')); }}
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px'}}
              >
                読み込み
              </button>
              <button
                className="ghost"
                onClick={()=> exportJSON()}
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px'}}
              >
                JSON書き出し
              </button>
              <label
                className="ghost"
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px', cursor: 'pointer'}}
              >
                JSON読み込み
                <input
                  type="file"
                  accept="application/json"
                  style={{display: 'none'}}
                  onChange={async (e)=>{
                    const f=e.target.files?.[0];
                    if(!f) return;
                    await importJSON(f);
                    location.reload();
                  }}
                />
              </label>
              <button
                className="ghost"
                onClick={handleCloudLoad}
                disabled={isCloudLoading}
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px'}}
              >
                {isCloudLoading ? "読込中..." : "☁️ クラウド読込"}
              </button>
              <button
                className="ghost"
                onClick={handleSyncNow}
                disabled={isCloudLoading}
                style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '12px', padding: '8px 12px'}}
              >
                {isCloudLoading ? "同期中..." : "🔄 クラウドから同期"}
              </button>
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

              {/* スターティングメンバー選択 */}
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

                  {/* ユニフォーム設定 */}
                  <UniformPicker teamId={teamId} />

                  {/* フォーメーション視覚化 */}
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

              {/* JSON取り込み */}
              <div style={{marginBottom: 16}}>
                <PlayerImport onImportComplete={refreshPlayers} />
              </div>
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

              {/* クラウド保存機能 */}
              <div style={{marginTop: 16, padding: 12, background: '#f8f9fa', borderRadius: 8}}>
                <div className="kicker" style={{marginBottom: 8}}>☁️ クラウド保存</div>
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
                          onClick={()=> {
                            const db = loadJSON();
                            db.players = db.players.filter(pl => pl.id !== p.value);
                            saveJSON(db);
                            refreshPlayers();
                          }}
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

                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
                        <footer style={{flex: 1}}>
                          先発:{" "}
                          {(FORMATIONS[m.formation || "4-4-2"] || FORMATIONS["4-4-2"]).map(k=>{
                            const pid = m.lineup?.[k];
                            const player = players.find(p=>p.id===pid);
                            return <span key={k}>{k}:{player? (player.number?`#${player.number} ${player.name}`:player.name):"-"}　</span>;
                          })}
                        </footer>

                        {/* スタジアムビジョン表示ボタン */}
                        <button
                          className="primary"
                          onClick={() => setVisionMatch(m)}
                          style={{
                            fontSize: '12px',
                            padding: '6px 12px',
                            whiteSpace: 'nowrap',
                            marginLeft: '12px'
                          }}
                        >
                          🏟️ ビジョン表示
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* 選手統計管理 */}
            <PlayerStatistics players={players} matches={matches} />

            {/* データ移行・同期 */}
            <DataMigration />

            {/* チームカスタマイズ */}
            <TeamCustomization />

            {/* ユーザー招待管理 - 管理者専用 */}
            {profile?.role === "admin" && <InvitationManager />}
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

      {/* スタジアムビジョン表示 */}
      {visionMatch && (
        <StadiumVisionDisplay
          match={visionMatch}
          players={players}
          onClose={() => setVisionMatch(null)}
        />
      )}
    </>
  );
}

export default function AppWithSupabase() {
  // Supabaseが利用できない場合は元のAppを使用
  if (!isSupabaseAvailable()) {
    return <OriginalApp />;
  }

  return (
    <AuthProvider>
      <SoccerApp />
    </AuthProvider>
  );
}