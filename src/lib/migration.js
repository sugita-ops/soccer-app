import { supabase } from './supabase'
import { loadJSON } from './jsonStore'

// JSONStoreデータをSupabaseに移行
export const migrateDataToSupabase = async (userId) => {
  try {
    const jsonData = loadJSON()
    const results = {
      players: { success: 0, failed: 0 },
      matches: { success: 0, failed: 0 },
      errors: []
    }

    console.log('データ移行開始:', jsonData)

    // 1. 選手データの移行
    if (jsonData.players && jsonData.players.length > 0) {
      for (const player of jsonData.players) {
        try {
          const { data, error } = await supabase
            .from('players')
            .insert({
              id: player.id,
              name: player.name,
              number: player.number || null,
              is_active: true
            })

          if (error) {
            console.warn('選手データ移行エラー:', error, player)
            results.errors.push(`選手 ${player.name}: ${error.message}`)
            results.players.failed++
          } else {
            results.players.success++
          }
        } catch (err) {
          console.warn('選手データ移行例外:', err, player)
          results.errors.push(`選手 ${player.name}: ${err.message}`)
          results.players.failed++
        }
      }
    }

    // 2. 試合データの移行
    if (jsonData.matches && jsonData.matches.length > 0) {
      for (const match of jsonData.matches) {
        try {
          // メイン試合データの挿入
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert({
              id: match.id,
              date: match.date || new Date().toISOString(),
              type: match.type || '練習試合',
              opponent: match.opponent || '',
              venue: match.venue || '',
              goals_for: parseInt(match.goalsFor) || 0,
              goals_against: parseInt(match.goalsAgainst) || 0,
              formation: match.formation || '4-4-2',
              mvp: match.mvp || '',
              notes: match.notes || '',
              youtube_url: match.youtubeUrl || '',
              photos: JSON.stringify(match.photos || []),
              is_multi_match: match.isMultiMatch || false,
              sub_matches: JSON.stringify(match.subMatches || [])
            })
            .select()
            .single()

          if (matchError) {
            console.warn('試合データ移行エラー:', matchError, match)
            results.errors.push(`試合 vs ${match.opponent}: ${matchError.message}`)
            results.matches.failed++
            continue
          }

          // ラインナップデータの移行
          if (match.lineup && typeof match.lineup === 'object') {
            for (const [position, playerId] of Object.entries(match.lineup)) {
              if (playerId) {
                try {
                  await supabase
                    .from('match_lineups')
                    .insert({
                      match_id: match.id,
                      player_id: playerId,
                      position: position,
                      is_starter: true
                    })
                } catch (lineupError) {
                  console.warn('ラインナップ移行エラー:', lineupError)
                }
              }
            }
          }

          // 交代データの移行
          if (match.substitutions && Array.isArray(match.substitutions)) {
            for (const sub of match.substitutions) {
              try {
                await supabase
                  .from('substitutions')
                  .insert({
                    match_id: match.id,
                    player_out_id: sub.out,
                    player_in_id: sub.in,
                    minute: parseInt(sub.minute) || 0,
                    reason: sub.reason || ''
                  })
              } catch (subError) {
                console.warn('交代データ移行エラー:', subError)
              }
            }
          }

          results.matches.success++

        } catch (err) {
          console.warn('試合データ移行例外:', err, match)
          results.errors.push(`試合 vs ${match.opponent}: ${err.message}`)
          results.matches.failed++
        }
      }
    }

    // 3. ユニフォーム設定の移行
    if (jsonData.teamUniforms) {
      try {
        const uniformData = jsonData.teamUniforms.default || {}
        await supabase
          .from('team_settings')
          .update({
            team_name: '宮中サッカー部',
            primary_color: '#6366f1', // 既存のブランドカラー
            logo_url: uniformData.fpHome || '',
            header_image_url: '/img/miyachu-header.png'
          })
          .eq('id', (await supabase.from('team_settings').select('id').single()).data?.id)
      } catch (err) {
        console.warn('ユニフォーム設定移行エラー:', err)
      }
    }

    return {
      success: true,
      results,
      message: `移行完了: 選手 ${results.players.success}件, 試合 ${results.matches.success}件`
    }

  } catch (error) {
    console.error('データ移行エラー:', error)
    return {
      success: false,
      error: error.message,
      message: 'データ移行中にエラーが発生しました'
    }
  }
}

// Supabaseからデータを読み込み（JSONStore形式で返す）
export const loadDataFromSupabase = async () => {
  try {
    const [playersResult, matchesResult] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true),
      supabase
        .from('matches')
        .select(`
          *,
          match_lineups(player_id, position, is_starter),
          substitutions(player_out_id, player_in_id, minute, reason)
        `)
        .order('date', { ascending: false })
    ])

    if (playersResult.error) throw playersResult.error
    if (matchesResult.error) throw matchesResult.error

    // JSONStore形式に変換
    const jsonData = {
      players: playersResult.data.map(player => ({
        id: player.id,
        name: player.name,
        number: player.number
      })),
      matches: matchesResult.data.map(match => {
        // ラインナップを元の形式に変換
        const lineup = {}
        match.match_lineups.forEach(ml => {
          lineup[ml.position] = ml.player_id
        })

        // 交代データを元の形式に変換
        const substitutions = match.substitutions.map(sub => ({
          id: crypto.randomUUID(),
          minute: sub.minute,
          out: sub.player_out_id,
          in: sub.player_in_id,
          reason: sub.reason || ''
        }))

        return {
          id: match.id,
          date: match.date.slice(0, 16), // yyyy-mm-ddThh:mm形式
          type: match.type,
          opponent: match.opponent,
          venue: match.venue,
          goalsFor: match.goals_for.toString(),
          goalsAgainst: match.goals_against.toString(),
          formation: match.formation,
          mvp: match.mvp,
          notes: match.notes,
          lineup,
          youtubeUrl: match.youtube_url,
          photos: JSON.parse(match.photos || '[]'),
          substitutions,
          isMultiMatch: match.is_multi_match,
          subMatches: JSON.parse(match.sub_matches || '[]')
        }
      }),
      teamUniforms: { default: {} } // プレースホルダー
    }

    return {
      success: true,
      data: jsonData,
      message: `データ読み込み完了: 選手 ${jsonData.players.length}件, 試合 ${jsonData.matches.length}件`
    }

  } catch (error) {
    console.error('Supabaseデータ読み込みエラー:', error)
    return {
      success: false,
      error: error.message,
      message: 'データ読み込み中にエラーが発生しました'
    }
  }
}

// データ同期（双方向）
export const syncDataBidirectional = async (userId) => {
  try {
    const jsonData = loadJSON()
    const supabaseResult = await loadDataFromSupabase()

    if (!supabaseResult.success) {
      return supabaseResult
    }

    const supabaseData = supabaseResult.data

    // 簡易的な同期ロジック
    // 新しいデータがあれば追加、既存データは更新
    let syncResults = {
      playersAdded: 0,
      matchesAdded: 0,
      playersUpdated: 0,
      matchesUpdated: 0,
      errors: []
    }

    // ローカルの新規選手をSupabaseに追加
    for (const localPlayer of jsonData.players || []) {
      const existsInSupabase = supabaseData.players.some(p => p.id === localPlayer.id)
      if (!existsInSupabase) {
        try {
          await supabase
            .from('players')
            .insert({
              id: localPlayer.id,
              name: localPlayer.name,
              number: localPlayer.number || null,
              is_active: true
            })
          syncResults.playersAdded++
        } catch (error) {
          syncResults.errors.push(`選手追加エラー: ${error.message}`)
        }
      }
    }

    // Supabaseの新規選手をローカルに追加
    for (const supabasePlayer of supabaseData.players || []) {
      const existsInLocal = jsonData.players?.some(p => p.id === supabasePlayer.id)
      if (!existsInLocal) {
        if (!jsonData.players) jsonData.players = []
        jsonData.players.push(supabasePlayer)
        syncResults.playersUpdated++
      }
    }

    // 類似の処理を試合データでも実行
    // （簡略化のため、ここでは基本的な同期のみ実装）

    return {
      success: true,
      syncResults,
      message: `同期完了: 新規選手 ${syncResults.playersAdded}件, 更新選手 ${syncResults.playersUpdated}件`
    }

  } catch (error) {
    console.error('データ同期エラー:', error)
    return {
      success: false,
      error: error.message,
      message: 'データ同期中にエラーが発生しました'
    }
  }
}