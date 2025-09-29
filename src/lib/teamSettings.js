import { supabase } from './supabase'

// チーム設定を取得
export const getTeamSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('team_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error
    }

    // デフォルト設定
    const defaultSettings = {
      team_name: '宮中サッカー部',
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      logo_url: '',
      header_image_url: '/img/miyachu-header.png'
    }

    return {
      data: data || defaultSettings,
      error: null
    }
  } catch (error) {
    console.error('Get team settings error:', error)
    return { data: null, error }
  }
}

// チーム設定を更新
export const updateTeamSettings = async (settings) => {
  try {
    // 既存の設定があるかチェック
    const { data: existing } = await supabase
      .from('team_settings')
      .select('id')
      .single()

    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('team_settings')
        .update({
          team_name: settings.team_name,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          logo_url: settings.logo_url || '',
          header_image_url: settings.header_image_url || '/img/miyachu-header.png'
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } else {
      // 新規作成
      const { data, error } = await supabase
        .from('team_settings')
        .insert({
          team_name: settings.team_name,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          logo_url: settings.logo_url || '',
          header_image_url: settings.header_image_url || '/img/miyachu-header.png'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }
  } catch (error) {
    console.error('Update team settings error:', error)
    return { data: null, error }
  }
}

// CSSカスタムプロパティを適用
export const applyThemeColors = (primaryColor, secondaryColor) => {
  const root = document.documentElement

  if (primaryColor) {
    root.style.setProperty('--brand', primaryColor)
  }

  if (secondaryColor) {
    root.style.setProperty('--brand-secondary', secondaryColor)
  }

  // CSS変数が存在しない場合は作成
  if (!root.style.getPropertyValue('--brand-secondary')) {
    root.style.setProperty('--brand-secondary', secondaryColor || primaryColor)
  }
}

// 画像ファイルをBase64に変換
export const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('有効な画像ファイルを選択してください'))
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB制限
      reject(new Error('ファイルサイズは2MB以下にしてください'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}

// プリセットカラーパレット
export const colorPresets = [
  { name: 'ブルー', color: '#6366f1' },
  { name: 'グリーン', color: '#16a34a' },
  { name: 'レッド', color: '#dc2626' },
  { name: 'オレンジ', color: '#ea580c' },
  { name: 'パープル', color: '#9333ea' },
  { name: 'ピンク', color: '#e11d48' },
  { name: 'イエロー', color: '#eab308' },
  { name: 'インディゴ', color: '#4f46e5' },
  { name: 'ティール', color: '#0d9488' },
  { name: 'グレー', color: '#6b7280' }
]