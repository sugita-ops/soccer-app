import React, { useState } from 'react';
import DataMigration from '../DataMigration';
import TeamCustomization from '../TeamCustomization';
import InvitationManager from '../InvitationManager';
import { loadJSON, saveJSON, exportJSON, importJSON } from '../../lib/jsonStore';

const SettingsSection = ({
  profile,
  logout,
  cloudPassword,
  setCloudPassword,
  isCloudLoading,
  handleCloudLoad,
  handleSyncNow,
  comments,
  user
}) => {
  const [activeTab, setActiveTab] = useState('team');

  const settingsTabs = [
    { id: 'team', label: 'チーム設定', icon: '🎨' },
    { id: 'data', label: 'データ管理', icon: '💾' },
    { id: 'users', label: 'ユーザー管理', icon: '👥' },
    { id: 'account', label: 'アカウント', icon: '👤' }
  ];

  const exportComments = () => {
    const data = JSON.stringify(comments, null, 2);
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      {/* 設定タブナビゲーション */}
      <section className="card">
        <h2>⚙️ 設定</h2>

        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 8
        }}>
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              style={{
                minWidth: 'fit-content',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                padding: '8px 16px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* チーム設定 */}
        {activeTab === 'team' && (
          <div className="stack">
            <TeamCustomization />
          </div>
        )}

        {/* データ管理 */}
        {activeTab === 'data' && (
          <div className="stack">
            <div className="card" style={{background: '#f8f9fa'}}>
              <h3>💾 データバックアップ・復元</h3>

              <div className="actions" style={{flexWrap: 'wrap', gap: 8}}>
                <button
                  className="primary"
                  onClick={()=> { const cur=loadJSON(); saveJSON(cur); alert('保存しました'); }}
                >
                  📱 ローカル保存
                </button>

                <button
                  className="ghost"
                  onClick={()=> { const cur=loadJSON(); alert('読み込み完了\n' + Object.keys(cur).join(', ')); }}
                >
                  📖 ローカル読み込み
                </button>

                <button
                  className="ghost"
                  onClick={()=> exportJSON()}
                >
                  📤 JSON書き出し
                </button>

                <label
                  className="ghost"
                  style={{cursor: 'pointer', display: 'inline-block'}}
                >
                  📥 JSON読み込み
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
                  onClick={exportComments}
                >
                  💬 コメント書き出し
                </button>
              </div>
            </div>

            <div className="card" style={{background: '#f0f9ff'}}>
              <h3>☁️ クラウド同期</h3>

              <div className="row" style={{gap: 8, alignItems: 'flex-end', marginBottom: 12}}>
                <div style={{flex: 1}}>
                  <label>同期パスワード</label>
                  <input
                    type="password"
                    value={cloudPassword}
                    onChange={e => setCloudPassword(e.target.value)}
                    placeholder="クラウド同期用パスワード"
                  />
                </div>
              </div>

              <div className="actions" style={{gap: 8}}>
                <button
                  className="primary"
                  onClick={handleCloudLoad}
                  disabled={isCloudLoading}
                >
                  {isCloudLoading ? "読込中..." : "☁️ クラウド読込"}
                </button>

                <button
                  className="ghost"
                  onClick={handleSyncNow}
                  disabled={isCloudLoading}
                >
                  {isCloudLoading ? "同期中..." : "🔄 今すぐ同期"}
                </button>
              </div>

              <div className="kicker" style={{marginTop: 8, fontSize: '11px'}}>
                ※ チーム間でデータを共有するためのクラウド同期機能
              </div>
            </div>

            <DataMigration />
          </div>
        )}

        {/* ユーザー管理 */}
        {activeTab === 'users' && (
          <div className="stack">
            {profile?.role === "admin" ? (
              <InvitationManager />
            ) : (
              <div className="card" style={{background: '#fef2f2'}}>
                <h3>👥 ユーザー管理</h3>
                <div className="kicker">
                  ユーザー管理機能は管理者のみが利用できます。
                </div>
              </div>
            )}

            <div className="card">
              <h3>📊 ユーザー情報</h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12
              }}>
                <div style={{
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4}}>
                    ユーザー名
                  </div>
                  <div className="kicker">
                    {profile?.name || user?.email || 'Unknown'}
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4}}>
                    権限レベル
                  </div>
                  <div className="kicker">
                    {profile?.role === 'admin' ? '👑 管理者' :
                     profile?.role === 'coach' ? '🏃 コーチ' : '👨‍👩‍👧‍👦 保護者'}
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: 14, fontWeight: 'bold', marginBottom: 4}}>
                    メールアドレス
                  </div>
                  <div className="kicker" style={{wordBreak: 'break-all'}}>
                    {user?.email || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アカウント */}
        {activeTab === 'account' && (
          <div className="stack">
            <div className="card">
              <h3>👤 アカウント情報</h3>

              <div style={{marginBottom: 16}}>
                <div style={{
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid var(--line)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 'bold'
                    }}>
                      {(profile?.name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: 2}}>
                        {profile?.name || 'ユーザー名未設定'}
                      </div>
                      <div className="kicker">{user?.email}</div>
                    </div>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                    <div>
                      <div className="kicker">権限</div>
                      <div style={{fontWeight: '500'}}>
                        {profile?.role === 'admin' ? '👑 管理者' :
                         profile?.role === 'coach' ? '🏃 コーチ' : '👨‍👩‍👧‍👦 保護者'}
                      </div>
                    </div>
                    <div>
                      <div className="kicker">登録日</div>
                      <div style={{fontWeight: '500'}}>
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : '不明'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="actions">
                <button className="ghost" onClick={logout} style={{color: '#dc2626'}}>
                  🚪 ログアウト
                </button>
              </div>
            </div>

            <div className="card" style={{background: '#fffbeb'}}>
              <h3>⚠️ アカウント設定</h3>

              <div className="kicker" style={{marginBottom: 12}}>
                アカウントに関する詳細設定は、今後のアップデートで追加予定です。
              </div>

              <div className="list">
                <div style={{
                  padding: 12,
                  background: '#fef3c7',
                  borderRadius: 8,
                  fontSize: '14px'
                }}>
                  🔜 プロフィール編集機能
                </div>
                <div style={{
                  padding: 12,
                  background: '#fef3c7',
                  borderRadius: 8,
                  fontSize: '14px'
                }}>
                  🔜 パスワード変更機能
                </div>
                <div style={{
                  padding: 12,
                  background: '#fef3c7',
                  borderRadius: 8,
                  fontSize: '14px'
                }}>
                  🔜 通知設定機能
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SettingsSection;