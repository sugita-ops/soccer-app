import React, { useState } from 'react';
import { UNIFORM_COLORS, GK_COLOR_MAP } from './UniformIcon';

const COLOR_OPTIONS = [
  { key: 'blue', label: '青', color: UNIFORM_COLORS.blue },
  { key: 'red', label: '赤', color: UNIFORM_COLORS.red },
  { key: 'white', label: '白', color: UNIFORM_COLORS.white },
  { key: 'yellow', label: '黄色', color: UNIFORM_COLORS.yellow },
  { key: 'green', label: '緑', color: UNIFORM_COLORS.green },
  { key: 'black', label: '黒', color: UNIFORM_COLORS.black }
];

export default function UniformSettings({
  currentSettings = { fpColor: 'blue', gkColor: 'yellow' },
  customUniforms = { fpHome: '', fpAway: '', gk: '' },
  onSave,
  toast
}) {
  const [selectedColor, setSelectedColor] = useState(currentSettings.fpColor);
  const [customImages, setCustomImages] = useState(customUniforms);
  const [uploading, setUploading] = useState({ fpHome: false, fpAway: false, gk: false });

  // ファイルアップロードハンドラー
  const handleUniformUpload = async (type, file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('ファイルサイズは3MB以下にしてください');
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
        toast.error('ファイルの読み込みに失敗しました');
        setUploading(prev => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('ファイルのアップロードに失敗しました');
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
    onSave({
      fpColor: selectedColor,
      gkColor: gkColor,
      customUniforms: customImages
    });
    toast.success('ユニフォーム設定を保存しました');
  };

  return (
    <div className="stack">
      {/* デフォルトユニフォーム選択 */}
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '12px',
        border: '2px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👕 デフォルトユニフォーム
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
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

      {/* カスタムユニフォーム */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📷 カスタムユニフォーム
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
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
      <div className="actions">
        <button className="primary" onClick={handleSave} style={{ fontSize: '16px', padding: '12px 24px' }}>
          設定を保存
        </button>
      </div>
    </div>
  );
}

// ユニフォームアップロードボックスコンポーネント
function UniformUploadBox({ title, type, image, uploading, onUpload, onRemove }) {
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
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
        画像なし
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
        選択されていません
      </div>
    </div>
  );
}
