import { formationMap } from '../lib/formations';
import './formation.css';
import UniformIcon, { UniformPlaceholder, GK_COLOR_MAP } from './UniformIcon';

export default function FormationPitch({
  formation = '4-2-3-1',
  players = [],
  teamUniforms = { fpColor: 'blue', gkColor: 'yellow', customUniforms: {} },
  useAway = false,
  layout = null
}) {
  const key = (formation in formationMap ? formation : '4-2-3-1');
  const finalLayout = layout || formationMap[key];

  // デフォルト色の設定
  const fpColor = teamUniforms?.fpColor || 'blue';
  const gkColor = teamUniforms?.gkColor || GK_COLOR_MAP[fpColor] || 'yellow';

  // カスタムユニフォーム
  const customUniforms = teamUniforms?.customUniforms || { fpHome: '', fpAway: '', gk: '' };

  return (
    <div
      className="formation-pitch"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 2',
        isolation: 'isolate',
        pointerEvents: 'none',
        backgroundImage: 'url("/img/pitch-lines.svg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#2d7a3e',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {finalLayout.map((pos, i) => {
        const p = players[i];
        const isGK = pos.role === 'GK';
        const uniformColor = isGK ? gkColor : fpColor;

        // カスタムユニフォーム画像の取得
        const customImage = isGK
          ? customUniforms.gk
          : (useAway ? customUniforms.fpAway : customUniforms.fpHome);

        return (
          <div
            key={i}
            className="formation-player"
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto'
            }}
          >
            {/* ユニフォームアイコン */}
            {p && p.name ? (
              customImage ? (
                <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                  <img
                    src={customImage}
                    alt="uniform"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  />
                  {p.number && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}>
                      {p.number}
                    </div>
                  )}
                </div>
              ) : (
                <UniformIcon
                  colorName={uniformColor}
                  number={p.number || ''}
                  size={32}
                />
              )
            ) : (
              <UniformPlaceholder size={32} />
            )}

            {/* 選手名表示 */}
            {p && p.name && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  fontSize: '10px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                #{p.number || '?'} {p.name}
              </div>
            )}

            {/* 未配置表示 */}
            {(!p || !p.name) && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '9px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                未配置
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
