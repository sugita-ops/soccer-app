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

  // フォーメーション別のポジション配置
  const getFormationPositions = (formation) => {
    const formations = {
      '4-4-2': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'ST1', 'ST2'],
      '4-3-3': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM', 'LCM', 'RCM', 'LW', 'ST', 'RW'],
      '3-5-2': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'LCM', 'CDM', 'RCM', 'RWB', 'ST1', 'ST2'],
      '4-2-3-1': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'CDM1', 'CDM2', 'LAM', 'CAM', 'RAM', 'ST'],
      '3-4-3': ['GK', 'LCB', 'CB', 'RCB', 'LM', 'LCM', 'RCM', 'RM', 'LW', 'ST', 'RW']
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
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{fontSize: '20px', fontWeight: 'bold'}}>
          ⚽ 宮中サッカー部 - 試合結果
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{fontSize: '16px'}}>
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
              fontSize: '14px'
            }}
          >
            ✕ 閉じる
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 400px 1fr',
        gap: '32px',
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* 左側 - ホームチーム情報 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            marginBottom: '24px',
            border: '3px solid rgba(255,255,255,0.4)'
          }}>
            ⚽
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
            宮中サッカー部
          </div>
          <div style={{fontSize: '18px', opacity: 0.8}}>
            {match.formation || '4-4-2'}
          </div>
        </div>

        {/* 中央 - スコア */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '24px',
          padding: '32px',
          border: '2px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{fontSize: '18px', marginBottom: '16px', textAlign: 'center'}}>
            <div style={{opacity: 0.8}}>{match.type}</div>
            <div style={{fontSize: '14px', marginTop: '4px'}}>
              {new Date(match.date).toLocaleDateString('ja-JP')}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(255,255,255,0.5)',
              fontFamily: 'monospace'
            }}>
              {match.goalsFor || 0}
            </div>
            <div style={{
              fontSize: '40px',
              opacity: 0.6
            }}>
              -
            </div>
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(255,255,255,0.5)',
              fontFamily: 'monospace'
            }}>
              {match.goalsAgainst || 0}
            </div>
          </div>

          <div style={{fontSize: '16px', textAlign: 'center', opacity: 0.9}}>
            @ {match.venue || '会場未定'}
          </div>

          {match.mvp && (
            <div style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'rgba(255,215,0,0.2)',
              borderRadius: '12px',
              border: '1px solid rgba(255,215,0,0.4)'
            }}>
              <div style={{fontSize: '14px', opacity: 0.8}}>MVP</div>
              <div style={{fontSize: '18px', fontWeight: 'bold', color: '#ffd700'}}>
                {match.mvp}
              </div>
            </div>
          )}
        </div>

        {/* 右側 - 相手チーム情報 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            marginBottom: '24px',
            border: '3px solid rgba(255,255,255,0.3)'
          }}>
            🏃
          </div>
          <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
            {match.opponent || '対戦相手'}
          </div>
          <div style={{fontSize: '18px', opacity: 0.8}}>
            相手チーム
          </div>
        </div>
      </div>

      {/* 下部 - スターティングメンバー */}
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        padding: '24px 32px',
        borderTop: '2px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{fontSize: '24px', margin: 0}}>
            🏟️ スターティングメンバー ({match.formation || '4-4-2'})
          </h3>
          <div style={{fontSize: '16px', opacity: 0.8}}>
            {positions.length}名
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {positions.map((position, index) => {
            const playerId = lineup[position]
            const playerInfo = getPlayerInfo(playerId)
            const isGK = position === 'GK'

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
                    {position}
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