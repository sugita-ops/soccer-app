import React, { useState } from 'react';
import { FORMATIONS_11, FORMATIONS_8 } from './MatchSection';

// 全フォーメーションを統合
const ALL_FORMATIONS = {
  ...FORMATIONS_11,
  ...FORMATIONS_8
};

const HistorySection = ({ matches, players, setVisionMatch }) => {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredMatches = matches.filter(match => {
    if (filterType === 'all') return true;
    return match.type === filterType;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'opponent':
        return (a.opponent || '').localeCompare(b.opponent || '');
      case 'score':
        const aScore = parseInt(a.goalsFor || 0) - parseInt(a.goalsAgainst || 0);
        const bScore = parseInt(b.goalsFor || 0) - parseInt(b.goalsAgainst || 0);
        return bScore - aScore;
      default:
        return 0;
    }
  });

  const exportMatches = () => {
    const data = JSON.stringify(matches, null, 2);
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matches.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMatchResult = (match) => {
    if (match.isMultiMatch && match.subMatches?.length > 0) {
      const wins = match.subMatches.filter(sm =>
        parseInt(sm.goalsFor || 0) > parseInt(sm.goalsAgainst || 0)
      ).length;
      const draws = match.subMatches.filter(sm =>
        parseInt(sm.goalsFor || 0) === parseInt(sm.goalsAgainst || 0)
      ).length;
      const losses = match.subMatches.length - wins - draws;
      return { wins, draws, losses, total: match.subMatches.length };
    } else {
      const goalsFor = parseInt(match.goalsFor || 0);
      const goalsAgainst = parseInt(match.goalsAgainst || 0);
      if (goalsFor > goalsAgainst) return { wins: 1, draws: 0, losses: 0, total: 1 };
      if (goalsFor === goalsAgainst) return { wins: 0, draws: 1, losses: 0, total: 1 };
      return { wins: 0, draws: 0, losses: 1, total: 1 };
    }
  };

  // 統計計算
  const stats = matches.reduce((acc, match) => {
    const result = getMatchResult(match);
    acc.total += result.total;
    acc.wins += result.wins;
    acc.draws += result.draws;
    acc.losses += result.losses;

    if (match.isMultiMatch && match.subMatches?.length > 0) {
      match.subMatches.forEach(sm => {
        acc.goalsFor += parseInt(sm.goalsFor || 0);
        acc.goalsAgainst += parseInt(sm.goalsAgainst || 0);
      });
    } else {
      acc.goalsFor += parseInt(match.goalsFor || 0);
      acc.goalsAgainst += parseInt(match.goalsAgainst || 0);
    }

    return acc;
  }, { total: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });

  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="stack">
      {/* 統計ダッシュボード */}
      <section className="card">
        <h2>📊 チーム成績</h2>

        <div className="grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}>
          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#f0fdf4',
            borderRadius: 8,
            border: '1px solid #bbf7d0'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--brand)'}}>
              {stats.total}
            </div>
            <div className="kicker">総試合数</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#ecfdf5',
            borderRadius: 8,
            border: '1px solid #86efac'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#059669'}}>
              {stats.wins}
            </div>
            <div className="kicker">勝利</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#fffbeb',
            borderRadius: 8,
            border: '1px solid #fcd34d'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#d97706'}}>
              {stats.draws}
            </div>
            <div className="kicker">引分</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#fef2f2',
            borderRadius: 8,
            border: '1px solid #fca5a5'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#dc2626'}}>
              {stats.losses}
            </div>
            <div className="kicker">敗北</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #cbd5e1'
          }}>
            <div style={{fontSize: 24, fontWeight: 'bold', color: '#475569'}}>
              {winRate}%
            </div>
            <div className="kicker">勝率</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 16,
            background: '#eff6ff',
            borderRadius: 8,
            border: '1px solid #bfdbfe'
          }}>
            <div style={{fontSize: 18, fontWeight: 'bold', color: '#3b82f6'}}>
              {stats.goalsFor} - {stats.goalsAgainst}
            </div>
            <div className="kicker">総得失点</div>
          </div>
        </div>
      </section>

      {/* フィルターとソート */}
      <section className="card">
        <h3>🔍 フィルター・ソート</h3>

        <div className="row" style={{gap: 8}}>
          <div>
            <label>試合種別</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">すべて</option>
              <option value="練習試合">練習試合</option>
              <option value="公式戦">公式戦</option>
              <option value="招待/カップ戦">招待/カップ戦</option>
            </select>
          </div>

          <div>
            <label>並び順</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">日付順（新しい順）</option>
              <option value="opponent">対戦相手順</option>
              <option value="score">得失点差順</option>
            </select>
          </div>
        </div>

        <div className="actions" style={{marginTop: 12}}>
          <button className="ghost" onClick={exportMatches}>
            試合データ書き出し
          </button>
          <span className="kicker">
            {filteredMatches.length}/{matches.length}件表示中
          </span>
        </div>
      </section>

      {/* 試合履歴一覧 */}
      <section className="card">
        <h3>📋 試合履歴</h3>

        {sortedMatches.length === 0 ? (
          <div className="kicker">
            {filterType === 'all'
              ? '保存された試合はまだありません。'
              : '条件に一致する試合がありません。'
            }
          </div>
        ) : (
          <div className="list">
            {sortedMatches.map(m => (
              <article key={m.id} className="match" style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom: 8}}>
                  <span className="badge">{m.type}</span>
                  <strong>{(m.date||"").replace("T"," ")} / vs {m.opponent||"-"} @ {m.venue||"-"}</strong>

                  {/* スコア表示 */}
                  {m.isMultiMatch && m.subMatches?.length > 0 ? (
                    <span style={{color: 'var(--brand)', fontWeight: 'bold'}}>
                      ｜{m.subMatches.length}試合 ({
                        m.subMatches.map((sm, i) => `${sm.goalsFor||0}-${sm.goalsAgainst||0}`).join(", ")
                      })
                    </span>
                  ) : (
                    <span style={{color: 'var(--brand)', fontWeight: 'bold'}}>
                      ｜{m.goalsFor||0} - {m.goalsAgainst||0}
                    </span>
                  )}

                  <span>｜{m.formation || "4-4-2"}</span>
                  {m.mvp && <span>｜MVP: {m.mvp}</span>}
                </div>

                {/* 試合メモ */}
                {m.notes && <div style={{marginBottom: 8}} className="kicker">{m.notes}</div>}

                {/* YouTube動画リンク */}
                {m.youtubeUrl && (
                  <div style={{marginBottom: 8}}>
                    <a
                      href={m.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--brand)',
                        textDecoration: 'none',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      🎥 YouTube動画を見る
                    </a>
                  </div>
                )}

                {/* 写真表示 */}
                {m.photos && m.photos.length > 0 && (
                  <div style={{marginBottom: 8}}>
                    <div className="kicker" style={{marginBottom: 4}}>写真:</div>
                    <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                      {m.photos.slice(0, 3).map((photo, index) => (
                        photo.startsWith('data:image/') ? (
                          <img
                            key={index}
                            src={photo}
                            alt={`写真${index + 1}`}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              border: '1px solid var(--line)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const newWindow = window.open();
                              newWindow.document.write(`<img src="${photo}" style="max-width:100%;max-height:100%;">`);
                            }}
                          />
                        ) : (
                          <a
                            key={index}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '12px',
                              color: 'var(--brand)',
                              textDecoration: 'none'
                            }}
                          >
                            📷 写真{index + 1}
                          </a>
                        )
                      ))}
                      {m.photos.length > 3 && (
                        <span className="kicker" style={{fontSize: '12px'}}>
                          他{m.photos.length - 3}枚
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 交代履歴 */}
                {m.substitutions && m.substitutions.length > 0 && (
                  <div style={{marginBottom: 8}}>
                    <div className="kicker" style={{marginBottom: 4}}>交代:</div>
                    <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                      {m.substitutions
                        .sort((a, b) => a.minute - b.minute)
                        .map((sub, index) => {
                          const outPlayer = players.find(p => p.id === sub.out);
                          const inPlayer = players.find(p => p.id === sub.in);
                          return (
                            <div key={sub.id || index} style={{marginBottom: 2}}>
                              {sub.minute}分: {outPlayer ? (outPlayer.num ? `#${outPlayer.num} ${outPlayer.name}` : outPlayer.name) : "不明"}
                              {" → "}
                              {inPlayer ? (inPlayer.num ? `#${inPlayer.num} ${inPlayer.name}` : inPlayer.name) : "不明"}
                              {sub.reason && ` (${sub.reason})`}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* スターティングメンバー表示 */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8}}>
                  <div style={{flex: 1, minWidth: '200px'}}>
                    <div className="kicker" style={{marginBottom: 4}}>先発メンバー:</div>
                    <div style={{fontSize: '11px', lineHeight: '1.4'}}>
                      {(ALL_FORMATIONS[m.formation || "4-4-2"] || ALL_FORMATIONS["4-4-2"]).map(k=>{
                        const pid = m.lineup?.[k];
                        const player = players.find(p=>p.id===pid);
                        return (
                          <span key={k} style={{marginRight: 8, display: 'inline-block', marginBottom: 2}}>
                            {k}:{player? (player.number?`#${player.number} ${player.name}`:player.name):"-"}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* スタジアムビジョン表示ボタン */}
                  <button
                    className="primary"
                    onClick={() => setVisionMatch(m)}
                    style={{
                      fontSize: '12px',
                      padding: '8px 12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🏟️ ビジョン表示
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HistorySection;