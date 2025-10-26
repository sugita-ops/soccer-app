import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'

export default function PlayerStatistics({ players = [], matches = [] }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [statistics, setStatistics] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedMatch, setSelectedMatch] = useState('')
  const [statInput, setStatInput] = useState({
    goals: 0,
    assists: 0,
    minutes_played: 90,
    yellow_cards: 0,
    red_cards: 0
  })

  // プレイヤー統計を読み込み
  const loadPlayerStatistics = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('player_statistics')
        .select(`
          *,
          player:players(name, number),
          match:matches(date, opponent, type)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setStatistics(data || [])
    } catch (err) {
      toast.error('統計データの読み込みに失敗しました')
      console.error('Load statistics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayerStatistics()
  }, [])

  // 統計データを保存
  const handleSaveStatistics = async (e) => {
    e.preventDefault()

    if (!selectedPlayer || !selectedMatch) {
      toast.error('選手と試合を選択してください')
      return
    }

    // 管理者・コーチのみ編集可能
    if (profile?.role !== 'admin' && profile?.role !== 'coach') {
      toast.error('統計データの編集権限がありません')
      return
    }

    setLoading(true)
    try {
      // 既存の統計があるかチェック
      const { data: existing } = await supabase
        .from('player_statistics')
        .select('id')
        .eq('player_id', selectedPlayer)
        .eq('match_id', selectedMatch)
        .single()

      if (existing) {
        // 更新
        const { error } = await supabase
          .from('player_statistics')
          .update({
            goals: parseInt(statInput.goals) || 0,
            assists: parseInt(statInput.assists) || 0,
            minutes_played: parseInt(statInput.minutes_played) || 0,
            yellow_cards: parseInt(statInput.yellow_cards) || 0,
            red_cards: parseInt(statInput.red_cards) || 0
          })
          .eq('id', existing.id)

        if (error) throw error
        toast.success('統計データを更新しました')
      } else {
        // 新規作成
        const { error } = await supabase
          .from('player_statistics')
          .insert({
            player_id: selectedPlayer,
            match_id: selectedMatch,
            goals: parseInt(statInput.goals) || 0,
            assists: parseInt(statInput.assists) || 0,
            minutes_played: parseInt(statInput.minutes_played) || 0,
            yellow_cards: parseInt(statInput.yellow_cards) || 0,
            red_cards: parseInt(statInput.red_cards) || 0
          })

        if (error) throw error
        toast.success('統計データを保存しました')
      }

      // フォームをリセット
      setSelectedPlayer('')
      setSelectedMatch('')
      setStatInput({
        goals: 0,
        assists: 0,
        minutes_played: 90,
        yellow_cards: 0,
        red_cards: 0
      })

      // 一覧を再読み込み
      loadPlayerStatistics()

    } catch (err) {
      toast.error('統計データの保存に失敗しました')
      console.error('Save statistics error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 選手別統計サマリー（Supabaseデータ + ローカルマッチデータの統合）
  const playerSummaries = useMemo(() => {
    const summaries = {}

    // Supabaseの統計データを集計
    statistics.forEach(stat => {
      const playerId = stat.player_id
      if (!summaries[playerId]) {
        summaries[playerId] = {
          player: stat.player,
          totalGoals: 0,
          totalAssists: 0,
          totalMinutes: 0,
          totalMatches: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          averageMinutes: 0
        }
      }

      const summary = summaries[playerId]
      summary.totalGoals += stat.goals || 0
      summary.totalAssists += stat.assists || 0
      summary.totalMinutes += stat.minutes_played || 0
      summary.totalMatches += 1
      summary.totalYellowCards += stat.yellow_cards || 0
      summary.totalRedCards += stat.red_cards || 0
    })

    // ローカルマッチデータから得点・アシストを自動集計
    matches.forEach(match => {
      if (match.goals && Array.isArray(match.goals)) {
        match.goals.forEach(goal => {
          // 得点者
          const scorerId = goal.scorer
          const scorerPlayer = players.find(p => p.id === scorerId)

          if (scorerPlayer) {
            if (!summaries[scorerId]) {
              summaries[scorerId] = {
                player: scorerPlayer,
                totalGoals: 0,
                totalAssists: 0,
                totalMinutes: 0,
                totalMatches: 0,
                totalYellowCards: 0,
                totalRedCards: 0,
                averageMinutes: 0
              }
            }
            summaries[scorerId].totalGoals += 1
          }

          // アシスト
          if (goal.assist) {
            const assistId = goal.assist
            const assistPlayer = players.find(p => p.id === assistId)

            if (assistPlayer) {
              if (!summaries[assistId]) {
                summaries[assistId] = {
                  player: assistPlayer,
                  totalGoals: 0,
                  totalAssists: 0,
                  totalMinutes: 0,
                  totalMatches: 0,
                  totalYellowCards: 0,
                  totalRedCards: 0,
                  averageMinutes: 0
                }
              }
              summaries[assistId].totalAssists += 1
            }
          }
        })
      }
    })

    // 平均出場時間を計算
    Object.values(summaries).forEach(summary => {
      summary.averageMinutes = summary.totalMatches > 0
        ? Math.round(summary.totalMinutes / summary.totalMatches)
        : 0
    })

    return Object.values(summaries).sort((a, b) => b.totalGoals - a.totalGoals)
  }, [statistics, matches, players])

  // 管理者・コーチ以外は表示のみ
  const canEdit = profile?.role === 'admin' || profile?.role === 'coach'

  return (
    <section className="card-enhanced">
      <h2>📊 選手統計管理</h2>
      <div className="kicker" style={{marginBottom: 16}}>
        選手ごとのゴール、アシスト、出場時間などの詳細統計を記録・管理します
      </div>

      <div className="stack" style={{gap: 16}}>
        {/* 統計入力フォーム（管理者・コーチのみ） */}
        {canEdit && (
          <div className="card" style={{padding: 16}}>
            <h3 style={{fontSize: '16px', marginBottom: 12}}>📝 統計データ入力</h3>

            <form onSubmit={handleSaveStatistics}>
              <div className="row-3" style={{marginBottom: 12}}>
                <div>
                  <label>選手</label>
                  <select
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    required
                  >
                    <option value="">選手を選択...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.number ? `#${player.number} ` : ''}{player.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>試合</label>
                  <select
                    value={selectedMatch}
                    onChange={e => setSelectedMatch(e.target.value)}
                    required
                  >
                    <option value="">試合を選択...</option>
                    {matches.map(match => (
                      <option key={match.id} value={match.id}>
                        {new Date(match.date).toLocaleDateString()} vs {match.opponent}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>出場時間（分）</label>
                  <input
                    type="number"
                    value={statInput.minutes_played}
                    onChange={e => setStatInput(prev => ({...prev, minutes_played: e.target.value}))}
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              <div className="row-3" style={{marginBottom: 12}}>
                <div>
                  <label>ゴール数</label>
                  <input
                    type="number"
                    value={statInput.goals}
                    onChange={e => setStatInput(prev => ({...prev, goals: e.target.value}))}
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label>アシスト数</label>
                  <input
                    type="number"
                    value={statInput.assists}
                    onChange={e => setStatInput(prev => ({...prev, assists: e.target.value}))}
                    min="0"
                    max="10"
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'end'}}>
                  <button
                    type="submit"
                    className="primary"
                    disabled={loading}
                    style={{whiteSpace: 'nowrap'}}
                  >
                    {loading ? '保存中...' : '📊 統計保存'}
                  </button>
                </div>
              </div>

              <div className="row-3" style={{marginBottom: 12}}>
                <div>
                  <label>イエローカード</label>
                  <input
                    type="number"
                    value={statInput.yellow_cards}
                    onChange={e => setStatInput(prev => ({...prev, yellow_cards: e.target.value}))}
                    min="0"
                    max="2"
                  />
                </div>
                <div>
                  <label>レッドカード</label>
                  <input
                    type="number"
                    value={statInput.red_cards}
                    onChange={e => setStatInput(prev => ({...prev, red_cards: e.target.value}))}
                    min="0"
                    max="1"
                  />
                </div>
                <div></div>
              </div>
            </form>
          </div>
        )}

        {/* 選手別統計サマリー */}
        <div className="card" style={{padding: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <h3 style={{fontSize: '16px', margin: 0}}>🏆 選手別統計サマリー</h3>
            <button
              className="ghost"
              onClick={loadPlayerStatistics}
              disabled={loading}
              style={{fontSize: '12px', padding: '4px 8px'}}
            >
              {loading ? '更新中...' : '🔄 更新'}
            </button>
          </div>

          {playerSummaries.length === 0 ? (
            <div className="kicker">まだ統計データがありません</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{background: '#f8f9fa', borderBottom: '2px solid #e5e7eb'}}>
                    <th style={{padding: '12px 8px', textAlign: 'left'}}>選手</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>試合数</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>ゴール</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>アシスト</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>平均出場時間</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>総出場時間</th>
                    <th style={{padding: '12px 8px', textAlign: 'center'}}>警告</th>
                  </tr>
                </thead>
                <tbody>
                  {playerSummaries.map((summary, index) => (
                    <tr
                      key={summary.player?.id || index}
                      style={{borderBottom: '1px solid #e5e7eb'}}
                    >
                      <td style={{padding: '12px 8px', fontWeight: 'bold'}}>
                        {summary.player?.number ? `#${summary.player.number} ` : ''}
                        {summary.player?.name || '不明'}
                      </td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>{summary.totalMatches}</td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 8px',
                          background: summary.totalGoals > 0 ? '#dcfce7' : '#f8f9fa',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          color: summary.totalGoals > 0 ? '#166534' : '#6b7280'
                        }}>
                          {summary.totalGoals}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>
                        <span style={{
                          padding: '4px 8px',
                          background: summary.totalAssists > 0 ? '#dbeafe' : '#f8f9fa',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          color: summary.totalAssists > 0 ? '#1e40af' : '#6b7280'
                        }}>
                          {summary.totalAssists}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>{summary.averageMinutes}分</td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>{summary.totalMinutes}分</td>
                      <td style={{padding: '12px 8px', textAlign: 'center'}}>
                        {summary.totalYellowCards > 0 && (
                          <span style={{color: '#f59e0b'}}>🟨{summary.totalYellowCards}</span>
                        )}
                        {summary.totalRedCards > 0 && (
                          <span style={{color: '#dc2626', marginLeft: 4}}>🟥{summary.totalRedCards}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 詳細統計一覧 */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>📋 試合別統計詳細</h3>

          {statistics.length === 0 ? (
            <div className="kicker">まだ統計データがありません</div>
          ) : (
            <div className="list">
              {statistics.map(stat => (
                <div
                  key={stat.id}
                  style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                    <div>
                      <div style={{fontWeight: 'bold', marginBottom: 4}}>
                        {stat.player?.number ? `#${stat.player.number} ` : ''}{stat.player?.name || '不明'}
                      </div>
                      <div style={{fontSize: '14px', color: 'var(--ink-2)'}}>
                        {new Date(stat.match?.date).toLocaleDateString()} vs {stat.match?.opponent} ({stat.match?.type})
                      </div>
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                    <div style={{fontSize: '14px'}}>
                      <span style={{opacity: 0.7}}>出場:</span> <strong>{stat.minutes_played}分</strong>
                    </div>
                    {stat.goals > 0 && (
                      <div style={{fontSize: '14px'}}>
                        <span style={{opacity: 0.7}}>ゴール:</span> <strong style={{color: '#16a34a'}}>{stat.goals}</strong>
                      </div>
                    )}
                    {stat.assists > 0 && (
                      <div style={{fontSize: '14px'}}>
                        <span style={{opacity: 0.7}}>アシスト:</span> <strong style={{color: '#2563eb'}}>{stat.assists}</strong>
                      </div>
                    )}
                    {stat.yellow_cards > 0 && (
                      <div style={{fontSize: '14px'}}>
                        <span style={{opacity: 0.7}}>イエロー:</span> <strong style={{color: '#f59e0b'}}>🟨{stat.yellow_cards}</strong>
                      </div>
                    )}
                    {stat.red_cards > 0 && (
                      <div style={{fontSize: '14px'}}>
                        <span style={{opacity: 0.7}}>レッド:</span> <strong style={{color: '#dc2626'}}>🟥{stat.red_cards}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 注意事項 */}
        {!canEdit && (
          <div style={{
            padding: '12px',
            background: '#fffaf0',
            border: '1px solid #fbd38d',
            borderRadius: '8px'
          }}>
            <div style={{fontSize: '14px', color: '#744210'}}>
              <strong>📝 統計データについて:</strong>
              <div style={{marginTop: 4}}>
                統計データの入力・編集は管理者またはコーチのみ可能です。閲覧はすべてのユーザーが可能です。
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}