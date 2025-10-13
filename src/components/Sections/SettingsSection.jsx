import React, { useState, useEffect } from 'react';
import UniformPicker from '../UniformPicker';
import PlayerImport from '../PlayerImport';
import { loadJSON, saveJSON } from '../../lib/jsonStore';

import { UNIFORM_COLORS, GK_COLOR_MAP } from '../UniformIcon';

const COLOR_OPTIONS = [
  { key: 'blue', label: '青', color: UNIFORM_COLORS.blue },
  { key: 'red', label: '赤', color: UNIFORM_COLORS.red },
  { key: 'white', label: '白', color: UNIFORM_COLORS.white },
  { key: 'yellow', label: '黄色', color: UNIFORM_COLORS.yellow },
  { key: 'green', label: '緑', color: UNIFORM_COLORS.green },
  { key: 'black', label: '黒', color: UNIFORM_COLORS.black }
];

const SettingsSection = ({ refreshPlayers, teamId }) => {
  const [activeTab, setActiveTab] = useState('uniforms');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [customImages, setCustomImages] = useState({ fpHome: '', fpAway: '', gk: '' });
  const [uploading, setUploading] = useState({ fpHome: false, fpAway: false, gk: false });
  const [isLoading, setIsLoading] = useState(false);

  const settingsTabs = [
    { id: 'uniforms', label: 'ユニフォーム', icon: '👕' },
    { id: 'players', label: '選手データ', icon: '👥' }
  ];

  // 初期読み込み
  useEffect(() => {
    const db = loadJSON();
    if (db.uniformSettings) {
      setSelectedColor(db.uniformSettings.fpColor || 'blue');
      setCustomImages(db.uniformSettings.customUniforms || { fpHome: '', fpAway: '', gk: '' });
    }
  }, []);

  // ファイルアップロードハンドラー
  const handleUniformUpload = async (type, file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('ファイルサイズは3MB以下にしてください');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setCustomImages(prev => ({ ...prev, [type]: base64 }));
        setUploading(prev => ({ ...prev, [type]: false }));
      };
      reader.onerror = () => {
        alert('ファイルの読み込みに失敗しました');
        setUploading(prev => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('ファイルのアップロードに失敗しました');
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // カスタムユニフォーム削除
  const handleRemoveCustom = (type) => {
    setCustomImages(prev => ({ ...prev, [type]: '' }));
  };

  // 保存
  const handleSave = () => {
    const gkColor = GK_COLOR_MAP[selectedColor] || 'yellow';
    const db = loadJSON();
    db.uniformSettings = {
      fpColor: selectedColor,
      gkColor: gkColor,
      customUniforms: customImages
    };
    saveJSON(db);
    alert('ユニフォーム設定を保存しました');
  };


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


  // ユニフォームアップロードボックスコンポーネント
  const UniformUploadBox = ({ title, type, image, uploading, onUpload, onRemove }) => {
    const fileInputId = `uniform-upload-${type}`;

    return (
      <div style={{
        border: '2px dashed #d1d5db',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          {title}
        </div>

        {image ? (
          <div>
            <img
              src={image}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '120px',
                marginBottom: '12px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <label
                htmlFor={fileInputId}
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                変更
              </label>
              <button
                onClick={onRemove}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                削除
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={fileInputId}
            style={{
              display: 'block',
              padding: '12px',
              background: '#f3f4f6',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {uploading ? (
              <span>⏳ アップロード中...</span>
            ) : (
              <span>📁 ファイルを選択</span>
            )}
          </label>
        )}

        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onUpload(file);
          }}
          style={{ display: 'none' }}
        />

        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
          {image ? '画像設定済み' : '選択されていません'}
        </div>
      </div>
    );
  };

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
            <div style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h4 style={{
                margin: '0 0 12px',
                fontSize: '18px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                👕 デフォルトユニフォーム
              </h4>
              <p style={{
                margin: '0 0 16px',
                color: '#666',
                fontSize: '14px'
              }}>
                カスタムユニフォームが設定されていない場合に使用されるデザインを選択
              </p>

              {/* 6色ボタン */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {COLOR_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedColor(option.key)}
                    style={{
                      position: 'relative',
                      padding: '20px',
                      backgroundColor: option.color,
                      color: option.key === 'white' ? '#333' : '#fff',
                      border: selectedColor === option.key
                        ? '3px solid #06b6d4'
                        : option.key === 'white'
                          ? '2px solid #d1d5db'
                          : '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedColor === option.key
                        ? '0 4px 12px rgba(6, 182, 212, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {selectedColor === option.key && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* カスタムユニフォーム設定 */}
            <div style={{
              padding: '20px',
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h4 style={{
                margin: '0 0 12px',
                fontSize: '18px',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📷 カスタムユニフォーム
              </h4>
              <p style={{
                margin: '0 0 16px',
                color: '#666',
                fontSize: '14px'
              }}>
                オリジナルのユニフォーム画像をアップロード（優先表示）
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {/* FP（ホーム） */}
                <UniformUploadBox
                  title="FP（ホーム）"
                  type="fpHome"
                  image={customImages.fpHome}
                  uploading={uploading.fpHome}
                  onUpload={(file) => handleUniformUpload('fpHome', file)}
                  onRemove={() => handleRemoveCustom('fpHome')}
                />

                {/* FP（アウェイ） */}
                <UniformUploadBox
                  title="FP（アウェイ）"
                  type="fpAway"
                  image={customImages.fpAway}
                  uploading={uploading.fpAway}
                  onUpload={(file) => handleUniformUpload('fpAway', file)}
                  onRemove={() => handleRemoveCustom('fpAway')}
                />

                {/* GK */}
                <UniformUploadBox
                  title="GK"
                  type="gk"
                  image={customImages.gk}
                  uploading={uploading.gk}
                  onUpload={(file) => handleUniformUpload('gk', file)}
                  onRemove={() => handleRemoveCustom('gk')}
                />
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                ※ PNG/SVG推奨、保存は端末に永続化され、JSONエクスポートにも含まれます。
              </p>
            </div>

            {/* 保存ボタン */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSave}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 48px',
                  borderRadius: '999px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                設定を保存
              </button>
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