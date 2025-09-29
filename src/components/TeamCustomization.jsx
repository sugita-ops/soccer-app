import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTeamSettings, updateTeamSettings, applyThemeColors, convertImageToBase64, colorPresets } from '../lib/teamSettings'
import { useToast } from './Toast'

export default function TeamCustomization() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHeader, setUploadingHeader] = useState(false)

  const [settings, setSettings] = useState({
    team_name: '宮中サッカー部',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    logo_url: '',
    header_image_url: '/img/miyachu-header.png'
  })

  const [originalSettings, setOriginalSettings] = useState(null)

  // 設定を読み込み
  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await getTeamSettings()
      if (error) {
        toast.error('チーム設定の読み込みに失敗しました')
        console.error('Load settings error:', error)
      } else if (data) {
        setSettings(data)
        setOriginalSettings(data)
        applyThemeColors(data.primary_color, data.secondary_color)
      }
    } catch (err) {
      toast.error('チーム設定の読み込み中にエラーが発生しました')
      console.error('Load settings exception:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // 設定を保存
  const handleSaveSettings = async () => {
    // 管理者のみ変更可能
    if (profile?.role !== 'admin') {
      toast.error('チーム設定の変更権限がありません')
      return
    }

    if (!settings.team_name.trim()) {
      toast.error('チーム名を入力してください')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await updateTeamSettings(settings)
      if (error) {
        toast.error('チーム設定の保存に失敗しました')
        console.error('Save settings error:', error)
      } else {
        toast.success('チーム設定を保存しました')
        setOriginalSettings(settings)
        applyThemeColors(settings.primary_color, settings.secondary_color)
      }
    } catch (err) {
      toast.error('チーム設定の保存中にエラーが発生しました')
      console.error('Save settings exception:', err)
    } finally {
      setSaving(false)
    }
  }

  // 設定をリセット
  const handleResetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      applyThemeColors(originalSettings.primary_color, originalSettings.secondary_color)
      toast.info('設定をリセットしました')
    }
  }

  // カラープリセット選択
  const handleSelectPresetColor = (color, type) => {
    setSettings(prev => ({
      ...prev,
      [type]: color
    }))
    // 即座に適用してプレビュー
    if (type === 'primary_color') {
      applyThemeColors(color, settings.secondary_color)
    } else if (type === 'secondary_color') {
      applyThemeColors(settings.primary_color, color)
    }
  }

  // ロゴ画像のアップロード
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (profile?.role !== 'admin') {
      toast.error('ロゴ変更の権限がありません')
      return
    }

    setUploadingLogo(true)
    try {
      const base64 = await convertImageToBase64(file)
      setSettings(prev => ({
        ...prev,
        logo_url: base64
      }))
      toast.success('ロゴをアップロードしました')
    } catch (error) {
      toast.error(error.message || 'ロゴのアップロードに失敗しました')
    } finally {
      setUploadingLogo(false)
    }
  }

  // ヘッダー画像のアップロード
  const handleHeaderUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (profile?.role !== 'admin') {
      toast.error('ヘッダー画像変更の権限がありません')
      return
    }

    setUploadingHeader(true)
    try {
      const base64 = await convertImageToBase64(file)
      setSettings(prev => ({
        ...prev,
        header_image_url: base64
      }))
      toast.success('ヘッダー画像をアップロードしました')
    } catch (error) {
      toast.error(error.message || 'ヘッダー画像のアップロードに失敗しました')
    } finally {
      setUploadingHeader(false)
    }
  }

  // 管理者以外はプレビューのみ
  const canEdit = profile?.role === 'admin'
  const hasChanges = originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings)

  if (loading) {
    return (
      <section className="card-enhanced">
        <h2>🎨 チームカスタマイズ</h2>
        <div className="kicker">設定を読み込み中...</div>
      </section>
    )
  }

  return (
    <section className="card-enhanced">
      <h2>🎨 チームカスタマイズ</h2>
      <div className="kicker" style={{marginBottom: 16}}>
        チームの名前、カラー、ロゴを自由にカスタマイズできます
      </div>

      <div className="stack" style={{gap: 16}}>
        {/* 基本設定 */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>📝 基本設定</h3>

          <div className="row-2" style={{marginBottom: 12}}>
            <div>
              <label>チーム名</label>
              <input
                type="text"
                value={settings.team_name}
                onChange={e => setSettings(prev => ({...prev, team_name: e.target.value}))}
                placeholder="チーム名を入力"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label>メインカラー</label>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => {
                    const color = e.target.value
                    setSettings(prev => ({...prev, primary_color: color}))
                    applyThemeColors(color, settings.secondary_color)
                  }}
                  disabled={!canEdit}
                  style={{width: '40px', height: '40px', border: 'none', borderRadius: '8px'}}
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={e => {
                    const color = e.target.value
                    setSettings(prev => ({...prev, primary_color: color}))
                    if (/^#[0-9A-F]{6}$/i.test(color)) {
                      applyThemeColors(color, settings.secondary_color)
                    }
                  }}
                  placeholder="#6366f1"
                  disabled={!canEdit}
                  style={{fontFamily: 'monospace'}}
                />
              </div>
            </div>
          </div>

          {/* カラープリセット */}
          <div style={{marginBottom: 16}}>
            <label>プリセットカラー</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 8,
              marginTop: 8
            }}>
              {colorPresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPresetColor(preset.color, 'primary_color')}
                  disabled={!canEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: `2px solid ${settings.primary_color === preset.color ? preset.color : 'transparent'}`,
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    cursor: canEdit ? 'pointer' : 'default',
                    fontSize: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: preset.color
                    }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ロゴとヘッダー画像 */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>🖼️ 画像設定</h3>

          <div className="row-2" style={{gap: 16}}>
            {/* ロゴ */}
            <div>
              <label>チームロゴ</label>
              <div style={{marginBottom: 8}}>
                {settings.logo_url ? (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '12px',
                    border: '2px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: '#f8f9fa'
                  }}>
                    <img
                      src={settings.logo_url}
                      alt="チームロゴ"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '12px',
                    border: '2px dashed var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8f9fa',
                    color: 'var(--ink-2)',
                    fontSize: '12px'
                  }}>
                    ロゴなし
                  </div>
                )}
              </div>

              {canEdit && (
                <label style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: uploadingLogo ? 'var(--ink-2)' : 'var(--brand)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: uploadingLogo ? 'default' : 'pointer',
                  fontSize: '14px'
                }}>
                  {uploadingLogo ? 'アップロード中...' : '📁 ロゴ選択'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{display: 'none'}}
                  />
                </label>
              )}
            </div>

            {/* ヘッダー画像 */}
            <div>
              <label>ヘッダー画像</label>
              <div style={{marginBottom: 8}}>
                <div style={{
                  width: '200px',
                  height: '100px',
                  borderRadius: '12px',
                  border: '2px solid var(--line)',
                  overflow: 'hidden',
                  background: '#f8f9fa'
                }}>
                  <img
                    src={settings.header_image_url}
                    alt="ヘッダー画像"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-2)',
                    fontSize: '12px'
                  }}>
                    画像なし
                  </div>
                </div>
              </div>

              {canEdit && (
                <label style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: uploadingHeader ? 'var(--ink-2)' : 'var(--brand)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: uploadingHeader ? 'default' : 'pointer',
                  fontSize: '14px'
                }}>
                  {uploadingHeader ? 'アップロード中...' : '📁 画像選択'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderUpload}
                    disabled={uploadingHeader}
                    style={{display: 'none'}}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* プレビューとコントロール */}
        {canEdit && (
          <div className="card" style={{padding: 16}}>
            <h3 style={{fontSize: '16px', marginBottom: 12}}>💾 設定の保存</h3>

            <div className="actions">
              <button
                className="primary"
                onClick={handleSaveSettings}
                disabled={saving || !hasChanges}
              >
                {saving ? '保存中...' : '💾 設定を保存'}
              </button>

              <button
                className="ghost"
                onClick={handleResetSettings}
                disabled={saving || !hasChanges}
              >
                🔄 変更を取り消し
              </button>

              {hasChanges && (
                <div className="kicker" style={{color: 'var(--warning)'}}>
                  ⚠️ 未保存の変更があります
                </div>
              )}
            </div>
          </div>
        )}

        {/* 権限メッセージ */}
        {!canEdit && (
          <div style={{
            padding: '12px',
            background: '#fffaf0',
            border: '1px solid #fbd38d',
            borderRadius: '8px'
          }}>
            <div style={{fontSize: '14px', color: '#744210'}}>
              <strong>🔒 カスタマイズについて:</strong>
              <div style={{marginTop: 4}}>
                チームのカスタマイズ設定は管理者のみが変更できます。現在の設定をプレビューできます。
              </div>
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <div style={{
          padding: '12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px'
        }}>
          <div style={{fontSize: '14px', color: '#0c4a6e'}}>
            <strong>💡 カスタマイズのヒント:</strong>
            <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>画像ファイルは2MB以下にしてください</li>
              <li>ロゴは正方形、ヘッダーは横長の画像が適しています</li>
              <li>カラーは即座にプレビューされますが、保存するまで永続化されません</li>
              <li>設定変更は全ユーザーに適用されます</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}