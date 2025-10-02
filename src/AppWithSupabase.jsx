import React, { useEffect, useState, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthContainer from './components/Auth/AuthContainer';
import TabNavigation, { TabContent } from './components/Navigation/TabNavigation';
import { emptyMatch } from './components/Sections/MatchSection';
import { loadJSON, saveJSON } from './lib/jsonStore';
import { syncWithCloud, savePlayersToCloud, syncFromCloudUpsert } from './lib/cloudSync';
import { useToast, ToastContainer } from './components/Toast';
import { isSupabaseAvailable } from './lib/supabase';

// 遅延読み込みで初期バンドルサイズを削減
const MatchSection = lazy(() => import('./components/Sections/MatchSection'));
const PlayersSection = lazy(() => import('./components/Sections/PlayersSection'));
const HistorySection = lazy(() => import('./components/Sections/HistorySection'));
const SettingsSection = lazy(() => import('./components/Sections/SettingsSection'));
const PlayerStatistics = lazy(() => import('./components/PlayerStatistics'));
const StadiumVisionDisplay = lazy(() => import('./components/StadiumVisionDisplay'));
const OriginalApp = lazy(() => import('./App'));

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

  // 基本状態
  const [players, setPlayers] = useState([]);
  const [match, setMatch] = useState(()=> emptyMatch());
  const [matches, setMatches] = useLocal("matches", []);
  const [comments, setComments] = useLocal("comments", []);

  // クラウド同期状態
  const [cloudPassword, setCloudPassword] = useState("");
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // ユニフォーム状態
  const [teamId] = useState('default');
  const [uniforms, setUniforms] = useState({ fpHome:'', fpAway:'', gk:'' });

  // スタジアムビジョン表示状態
  const [visionMatch, setVisionMatch] = useState(null);

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

  const saveMatch = () => {
    setMatches(m => [ { ...match }, ...m ]);
    setMatch(emptyMatch(match.formation));
    toast.success("試合を保存しました");
  };

  // 認証待機中（改善版）
  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-logo">⚽</div>
          <div style={{textAlign: 'center', color: 'var(--ink-2)', marginBottom: '16px'}}>
            アプリを起動中...
          </div>
          <div style={{
            width: '200px',
            height: '4px',
            background: 'var(--line)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'var(--brand)',
              borderRadius: '2px',
              animation: 'loading-bar 2s ease-in-out infinite'
            }} />
          </div>
          <style>{`
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
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

      {/* ヒーローセクション（タブナビ上部に表示） */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, #10963f 100%)',
        color: 'white',
        padding: '16px',
        position: 'relative'
      }}>
        <div style={{textAlign: 'center'}}>
          <h1 style={{margin: 0, fontSize: '18px', fontWeight: 'bold'}}>⚽ 行け！宮中サッカー部</h1>
          <p style={{margin: '4px 0 0', fontSize: '12px', opacity: 0.9}}>
            ようこそ、{profile?.name || user.email}さん
          </p>
        </div>

        {/* ログアウトボタン */}
        <button
          onClick={logout}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          ログアウト
        </button>
      </div>

      <TabNavigation defaultTab="match">
        {/* 試合記録タブ */}
        <TabContent tabId="match">
          <MatchSection
            players={players}
            match={match}
            setMatch={setMatch}
            saveMatch={saveMatch}
            teamId={teamId}
            uniforms={uniforms}
          />
        </TabContent>

        {/* 選手管理タブ */}
        <TabContent tabId="players">
          <PlayersSection
            players={players}
            refreshPlayers={refreshPlayers}
            cloudPassword={cloudPassword}
            setCloudPassword={setCloudPassword}
            isCloudLoading={isCloudLoading}
            handleCloudSave={handleCloudSave}
          />
        </TabContent>

        {/* 試合履歴タブ */}
        <TabContent tabId="history">
          <HistorySection
            matches={matches}
            players={players}
            setVisionMatch={setVisionMatch}
          />
        </TabContent>

        {/* 統計タブ */}
        <TabContent tabId="stats">
          <PlayerStatistics players={players} matches={matches} />
        </TabContent>

        {/* 設定タブ */}
        <TabContent tabId="settings">
          <SettingsSection
            profile={profile}
            logout={logout}
            cloudPassword={cloudPassword}
            setCloudPassword={setCloudPassword}
            isCloudLoading={isCloudLoading}
            handleCloudLoad={handleCloudLoad}
            handleSyncNow={handleSyncNow}
            comments={comments}
            user={user}
          />
        </TabContent>
      </TabNavigation>

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