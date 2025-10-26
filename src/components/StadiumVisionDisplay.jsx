import { useState, useEffect } from 'react'

export default function StadiumVisionDisplay({ match, players = [], onClose }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // リアルタイム時計
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!match) return null

  // 選手情報を取得
  const getPlayerInfo = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player ? {
      name: player.name,
      number: player.number
    } : { name: '未登録', number: '' }
  }

  // ポジションをカテゴリに変換
  const getPositionCategory = (position) => {
    if (position === 'GK') return 'GK'
    if (['LB', 'LCB', 'CB', 'RCB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DF'
    if (['LM', 'LCM', 'CM', 'CDM', 'CDM1', 'CDM2', 'RCM', 'RM', 'LAM', 'CAM', 'RAM'].includes(position)) return 'MF'
    if (['LW', 'ST', 'ST1', 'ST2', 'RW'].includes(position)) return 'FW'
    return position
  }

  // フォーメーション別のポジション配置
  const getFormationPositions = (formation) => {
    const formations = {
      // 11人制
      '4-4-2': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'ST1', 'ST2'],
      '4-3-3': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW'],
      '3-5-2': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'LCM', 'CDM', 'RCM', 'RWB', 'ST1', 'ST2'],
      '4-2-3-1': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM1', 'CDM2', 'LAM', 'CAM', 'RAM', 'ST'],
      '3-4-3': ['GK', 'LCB', 'CB', 'RCB', 'LM', 'LCM', 'RCM', 'RM', 'LW', 'ST', 'RW'],
      // 8人制
      '2-3-2': ['GK', 'LCB', 'RCB', 'LM', 'CM', 'RM', 'ST1', 'ST2'],
      '3-2-2': ['GK', 'LCB', 'CB', 'RCB', 'LCM', 'RCM', 'ST1', 'ST2'],
      '2-4-1': ['GK', 'LCB', 'RCB', 'LM', 'LCM', 'RCM', 'RM', 'ST'],
      '3-3-1': ['GK', 'LCB', 'CB', 'RCB', 'LM', 'CM', 'RM', 'ST']
    }
    return formations[formation] || formations['4-4-2']
  }

  const positions = getFormationPositions(match.formation || '4-4-2')
  const lineup = match.lineup || {}

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 30%, #2d1b4e 70%, #1a1035 100%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* スタジアムの観客席シルエット（上部） */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '120px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        {/* 観客シルエット */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: 0,
          right: 0,
          height: '60px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 3px, transparent 3px, transparent 8px)',
          opacity: 0.6
        }} />
      </div>

      {/* スタジアムの観客席シルエット（下部） */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '150px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        {/* 観客シルエット */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: 0,
          right: 0,
          height: '80px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 10px)',
          opacity: 0.7
        }} />
      </div>

      {/* スポットライト効果 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      {/* ヘッダー */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255,255,255,0.3)',
        flexWrap: 'wrap',
        gap: '8px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{fontSize: '16px', fontWeight: 'bold', flex: '1 1 auto'}}>
          ⚽ 宮中サッカー部 - 試合結果
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
          <div style={{fontSize: '14px', whiteSpace: 'nowrap'}}>
            {currentTime.toLocaleString('ja-JP')}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            ✕ 閉じる
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '16px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 5,
        perspective: '1000px'
      }}>
        {/* スコアカード */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '16px',
          padding: '20px 16px',
          border: '2px solid rgba(255,255,255,0.3)',
          transform: 'rotateX(2deg)',
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.2)'
        }}>
          <div style={{fontSize: '14px', marginBottom: '12px', textAlign: 'center'}}>
            <div style={{opacity: 0.8}}>{match.type}</div>
            <div style={{fontSize: '12px', marginTop: '4px'}}>
              {new Date(match.date).toLocaleDateString('ja-JP')}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: '16px',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '56px',
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(255,255,255,0.5)',
              fontFamily: 'monospace'
            }}>
              {match.goalsFor || 0}
            </div>
            <div style={{
              fontSize: '24px',
              opacity: 0.6
            }}>
              -
            </div>
            <div style={{
              fontSize: '56px',
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(255,255,255,0.5)',
              fontFamily: 'monospace'
            }}>
              {match.goalsAgainst || 0}
            </div>
          </div>

          <div style={{fontSize: '14px', textAlign: 'center', opacity: 0.9, marginBottom: '8px'}}>
            @ {match.venue || '会場未定'}
          </div>

          {/* 得点者リスト */}
          {match.goals && match.goals.length > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(16,185,129,0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(16,185,129,0.4)'
            }}>
              <div style={{fontSize: '12px', opacity: 0.8, marginBottom: '8px', textAlign: 'center'}}>
                ⚽ 得点者
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center'
              }}>
                {(() => {
                  // 得点者ごとに集計
                  const scorerStats = {};
                  match.goals.forEach(goal => {
                    const playerInfo = getPlayerInfo(goal.scorer);
                    const key = goal.scorer;
                    if (!scorerStats[key]) {
                      scorerStats[key] = {
                        player: playerInfo,
                        count: 0
                      };
                    }
                    scorerStats[key].count++;
                  });

                  return Object.values(scorerStats).map((stat, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>#{stat.player.number || '?'} {stat.player.name}</span>
                      {stat.count > 1 && (
                        <span style={{
                          fontSize: '16px',
                          color: '#ffd700'
                        }}>
                          {'⚽'.repeat(stat.count)}
                        </span>
                      )}
                      {stat.count > 1 && (
                        <span style={{
                          fontSize: '12px',
                          opacity: 0.9,
                          marginLeft: '2px'
                        }}>
                          ({stat.count}点)
                        </span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {match.mvp && (
            <div style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(255,215,0,0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(255,215,0,0.4)',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '12px', opacity: 0.8}}>MVP</div>
              <div style={{fontSize: '16px', fontWeight: 'bold', color: '#ffd700'}}>
                {match.mvp}
              </div>
            </div>
          )}
        </div>

        {/* チーム情報 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          transform: 'rotateX(1deg)',
          transformStyle: 'preserve-3d'
        }}>
          {/* ホームチーム */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '12px',
              border: '2px solid rgba(255,255,255,0.4)'
            }}>
              ⚽
            </div>
            <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center'}}>
              宮中サッカー部
            </div>
            <div style={{fontSize: '12px', opacity: 0.8}}>
              {match.formation || '4-4-2'}
            </div>
          </div>

          {/* 相手チーム */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '12px',
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              🏃
            </div>
            <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center'}}>
              {match.opponent || '対戦相手'}
            </div>
            <div style={{fontSize: '12px', opacity: 0.8}}>
              相手チーム
            </div>
          </div>
        </div>
      </div>

      {/* 下部 - スターティングメンバー */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '16px',
        borderTop: '2px solid rgba(255,255,255,0.3)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h3 style={{fontSize: '18px', margin: 0}}>
            🏟️ スターティングメンバー ({match.formation || '4-4-2'})
          </h3>
          <div style={{fontSize: '14px', opacity: 0.8}}>
            {positions.length}名
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px'
        }}>
          {positions.map((position, index) => {
            const playerId = lineup[position]
            const playerInfo = getPlayerInfo(playerId)
            const posCategory = getPositionCategory(position)
            const isGK = posCategory === 'GK'

            return (
              <div
                key={position}
                style={{
                  background: isGK
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
                  border: `2px solid ${isGK ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isGK ? '#22c55e' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {playerInfo.number || '?'}
                </div>
                <div>
                  <div style={{fontSize: '12px', opacity: 0.8, marginBottom: '2px'}}>
                    {posCategory}
                  </div>
                  <div style={{fontSize: '16px', fontWeight: 'bold'}}>
                    {playerInfo.name}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 交代情報 */}
        {match.substitutions && match.substitutions.length > 0 && (
          <div style={{marginTop: '24px'}}>
            <h4 style={{fontSize: '18px', marginBottom: '12px'}}>
              🔄 交代情報
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {match.substitutions
                .sort((a, b) => a.minute - b.minute)
                .map((sub, index) => {
                  const outPlayer = getPlayerInfo(sub.out)
                  const inPlayer = getPlayerInfo(sub.in)
                  return (
                    <div
                      key={sub.id || index}
                      style={{
                        background: 'rgba(251, 191, 36, 0.2)',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px'
                      }}
                    >
                      <strong>{sub.minute}'</strong>{' '}
                      <span style={{opacity: 0.8}}>
                        #{outPlayer.number} {outPlayer.name}
                      </span>
                      {' → '}
                      <span style={{color: '#fbbf24'}}>
                        #{inPlayer.number} {inPlayer.name}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}