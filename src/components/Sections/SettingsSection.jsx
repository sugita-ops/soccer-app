import React, { useState, useEffect } from 'react';
import UniformPicker from '../UniformPicker';
import PlayerImport from '../PlayerImport';
import { loadJSON, saveJSON } from '../../lib/jsonStore';

const DEFAULT_UNIFORMS = {
  brazil: {
    name: 'ブラジル',
    colors: {
      primary: '#FFEB3B',
      secondary: '#4CAF50',
      accent: '#FFC107'
    },
    gradient: 'linear-gradient(135deg, #FFEB3B 0%, #4CAF50 100%)',
    icon: '🇧🇷'
  },
  red: {
    name: 'レッド',
    colors: {
      primary: '#F44336',
      secondary: '#FFFFFF',
      accent: '#D32F2F'
    },
    gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
    icon: '🔴'
  },
  white: {
    name: 'ホワイト',
    colors: {
      primary: '#FFFFFF',
      secondary: '#2196F3',
      accent: '#E3F2FD'
    },
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%)',
    icon: '⚪'
  },
  black: {
    name: 'ブラック',
    colors: {
      primary: '#212121',
      secondary: '#FFD700',
      accent: '#424242'
    },
    gradient: 'linear-gradient(135deg, #212121 0%, #424242 100%)',
    icon: '⚫'
  }
};

const SettingsSection = ({ refreshPlayers, teamId }) => {
  const [activeTab, setActiveTab] = useState('uniforms');
  const [selectedDefaultUniform, setSelectedDefaultUniform] = useState('brazil');
  const [isLoading, setIsLoading] = useState(false);

  const settingsTabs = [
    { id: 'uniforms', label: 'ユニフォーム', icon: '👕' },
    { id: 'players', label: '選手データ', icon: '👥' }
  ];

  // デフォルトユニフォーム設定の保存（将来的にクラウド保存）
  const saveDefaultUniform = async (uniformKey) => {
    setIsLoading(true);
    try {
      // TODO: クラウド保存機能を実装
      setSelectedDefaultUniform(uniformKey);
      console.log('🎨 Default uniform saved:', uniformKey);

      // 一時的にローカルストレージに保存
      localStorage.setItem('defaultUniform', uniformKey);
    } catch (error) {
      console.error('Failed to save default uniform:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // デフォルトユニフォーム設定の読み込み
  useEffect(() => {
    const savedUniform = localStorage.getItem('defaultUniform');
    if (savedUniform && DEFAULT_UNIFORMS[savedUniform]) {
      setSelectedDefaultUniform(savedUniform);
    }
  }, []);


  // CSV export functionality
  const exportPlayersCSV = () => {
    const db = loadJSON();
    const players = db.players || [];

    if (players.length === 0) {
      alert('エクスポートする選手データがありません');
      return;
    }

    // Create CSV header and data
    const csvHeader = '名前,背番号,ポジション';
    const csvData = players.map(player =>
      `${player.name},${player.number || ''},${player.position || ''}`
    ).join('\n');

    const csvContent = csvHeader + '\n' + csvData;

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.csv';
    a.click();
    URL.revokeObjectURL(url);
  };


  const DefaultUniformCard = ({ uniformKey, uniform, isSelected, onSelect }) => (
    <div
      className={`default-uniform-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(uniformKey)}
      style={{
        background: uniform.gradient,
        border: isSelected ? '3px solid #00BCD4' : '2px solid rgba(255,255,255,0.3)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSelected
          ? '0 8px 32px rgba(0,188,212,0.3)'
          : '0 4px 16px rgba(0,0,0,0.1)',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#00BCD4',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
      )}

      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
        {uniform.icon}
      </div>

      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: uniformKey === 'white' ? '#1976D2' : '#FFFFFF',
        textShadow: uniformKey === 'white' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        {uniform.name}
      </div>

      <div style={{
        fontSize: '12px',
        color: uniformKey === 'white' ? '#666' : 'rgba(255,255,255,0.8)',
        marginTop: '4px'
      }}>
        デフォルト
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          ⚙️ チーム設定
        </h2>
        <p style={{
          margin: '8px 0 0',
          color: '#666',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          ユニフォームと選手データを管理
        </p>
      </div>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: 'rgba(255,255,255,0.1)',
        padding: '8px',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)'
      }}>
        {settingsTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              background: activeTab === tab.id
                ? 'rgba(255,255,255,0.9)'
                : 'transparent',
              color: activeTab === tab.id ? '#333' : 'white',
              fontSize: '16px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === tab.id
                ? '0 4px 16px rgba(0,0,0,0.1)'
                : 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツエリア */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        minHeight: '400px'
      }}>
        {activeTab === 'uniforms' && (
          <div>
            <h3 style={{
              margin: '0 0 24px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              👕 ユニフォーム設定
            </h3>

            {/* デフォルトユニフォーム選択 */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                color: '#333'
              }}>
                🎨 デフォルトユニフォーム
              </h4>
              <p style={{
                margin: '0 0 20px',
                color: '#666',
                fontSize: '14px'
              }}>
                カスタムユニフォームが設定されていない場合に使用されるデザインを選択
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                {Object.entries(DEFAULT_UNIFORMS).map(([key, uniform]) => (
                  <DefaultUniformCard
                    key={key}
                    uniformKey={key}
                    uniform={uniform}
                    isSelected={selectedDefaultUniform === key}
                    onSelect={saveDefaultUniform}
                  />
                ))}
              </div>

              {isLoading && (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  設定を保存中...
                </div>
              )}
            </div>

            {/* カスタムユニフォーム設定 */}
            <div>
              <h4 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                color: '#333'
              }}>
                📸 カスタムユニフォーム
              </h4>
              <p style={{
                margin: '0 0 20px',
                color: '#666',
                fontSize: '14px'
              }}>
                オリジナルのユニフォーム画像をアップロード（優先表示）
              </p>
              <UniformPicker teamId={teamId} />
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div>
            <h3 style={{
              margin: '0 0 24px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              👥 選手データ管理
            </h3>


            {/* CSV Export/Import Section */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                color: '#333'
              }}>
                📊 CSV データ管理
              </h4>
              <p style={{
                margin: '0 0 20px',
                color: '#666',
                fontSize: '14px'
              }}>
                選手データの出力と取り込み
              </p>

              {/* CSV Export */}
              <button
                onClick={exportPlayersCSV}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '20px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(76,175,80,0.3)',
                  marginBottom: '24px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                <span style={{ fontSize: '32px' }}>📤</span>
                <div>選手データ出力</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  現在の選手データをCSVで保存
                </div>
              </button>
            </div>

            {/* CSV Import Section */}
            <div>
              <h4 style={{
                margin: '0 0 16px',
                fontSize: '18px',
                color: '#333'
              }}>
                📁 CSV データ取り込み
              </h4>
              <p style={{
                margin: '0 0 20px',
                color: '#666',
                fontSize: '14px'
              }}>
                CSVファイル形式で選手データを一括登録<br/>
                <strong>形式:</strong> 名前,背番号,ポジション
              </p>

              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#495057',
                  fontFamily: 'monospace'
                }}>
                  <strong>📋 CSVサンプル:</strong><br/>
                  田中太郎,10,MF<br/>
                  佐藤次郎,9,FW<br/>
                  山田三郎,1,GK
                </div>
              </div>

              <PlayerImport onImportComplete={refreshPlayers} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsSection;