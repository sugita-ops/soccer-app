import { useState } from 'react';

export default function GoalTimeline({
  goals = [],
  players = [],
  onEdit,
  onDelete,
  readonly = false
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ウィンドウリサイズを監視
  window.addEventListener('resize', () => {
    setIsMobile(window.innerWidth < 768);
  });

  const getPlayerInfo = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player
      ? { name: player.name, number: player.number }
      : { name: '不明', number: '' };
  };

  const sortedGoals = [...goals].sort((a, b) => a.minute - b.minute);

  if (sortedGoals.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: '12px',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        まだ得点記録がありません
      </div>
    );
  }

  // モバイル表示（縦スクロールカード）
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {sortedGoals.map((goal, index) => {
          const scorer = getPlayerInfo(goal.scorer);
          const assistant = goal.assist ? getPlayerInfo(goal.assist) : null;

          return (
            <div
              key={goal.id}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    ⚽
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {goal.minute}'
                  </div>
                </div>
                {!readonly && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onEdit(goal)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(goal.id)}
                      style={{
                        background: 'rgba(239,68,68,0.3)',
                        border: '1px solid rgba(239,68,68,0.5)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: assistant ? '8px' : '0'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {scorer.number || '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>得点者</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {scorer.name}
                    </div>
                  </div>
                </div>

                {assistant && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {assistant.number || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>アシスト</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {assistant.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // デスクトップ表示（横長タイムライン）
  return (
    <div style={{
      position: 'relative',
      padding: '24px 0'
    }}>
      {/* タイムライン */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
        borderRadius: '2px',
        zIndex: 0
      }} />

      {/* 得点カード */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        {sortedGoals.map((goal, index) => {
          const scorer = getPlayerInfo(goal.scorer);
          const assistant = goal.assist ? getPlayerInfo(goal.assist) : null;

          return (
            <div
              key={goal.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                maxWidth: '200px'
              }}
            >
              {/* タイムライン上の点 */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                border: '4px solid #10b981',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(16,185,129,0.4)'
              }} />

              {/* カード */}
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                width: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minHeight: '140px'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '12px',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  {goal.minute}'
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}>
                  <div style={{ opacity: 0.8, marginBottom: '4px' }}>⚽ 得点者</div>
                  <div style={{ fontWeight: 'bold' }}>
                    #{scorer.number || '?'} {scorer.name}
                  </div>
                </div>

                {assistant && (
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px'
                  }}>
                    <div style={{ opacity: 0.8, marginBottom: '4px' }}>🎯 アシスト</div>
                    <div style={{ fontWeight: 'bold' }}>
                      #{assistant.number || '?'} {assistant.name}
                    </div>
                  </div>
                )}

                {!readonly && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '12px'
                  }}>
                    <button
                      onClick={() => onEdit(goal)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(goal.id)}
                      style={{
                        flex: 1,
                        background: 'rgba(239,68,68,0.3)',
                        border: '1px solid rgba(239,68,68,0.5)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
