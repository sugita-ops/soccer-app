import { formationMap } from '../lib/formations';
import './formation.css';

export default function FormationPitch({
  formation = '4-2-3-1',
  players = [],
  teamUniforms,
  useAway = false,
  layout = null
}) {
  const key = (formation in formationMap ? formation : '4-2-3-1');
  const finalLayout = layout || formationMap[key];

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
            {/* ユニフォームアイコン - フォールバックチェーン */}
            <UniformIcon
              role={pos.role}
              playerNumber={p?.number || p?.jersey}
              hasPlayer={!!(p && p.name)}
            />

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
                #{p.number || p.jersey || '?'} {p.name}
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

// フォールバックチェーン付きユニフォームアイコン
function UniformIcon({ role, playerNumber, hasPlayer }) {
  const isGK = role === 'GK';
  const uniformColor = isGK ? '#FF5722' : '#2196F3';

  if (!hasPlayer) {
    return (
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(128,128,128,0.5)',
          border: '2px solid rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '8px'
        }}
      >
        ?
      </div>
    );
  }

  // フォールバック1: IMG
  return (
    <ImgUniform
      uniformColor={uniformColor}
      playerNumber={playerNumber}
      fallback={
        // フォールバック2: SVG
        <SvgUniform
          uniformColor={uniformColor}
          playerNumber={playerNumber}
          fallback={
            // フォールバック3: 四角形（確実に表示）
            <FallbackUniform
              uniformColor={uniformColor}
              playerNumber={playerNumber}
            />
          }
        />
      }
    />
  );
}

// フォールバック1: IMG
function ImgUniform({ uniformColor, playerNumber, fallback }) {
  const imgSrc = uniformColor === '#FF5722' ? '/img/uniform-gk.png' : '/img/uniform-fp.png';

  return (
    <img
      src={imgSrc}
      alt="uniform"
      style={{ width: '24px', height: '24px' }}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'block';
      }}
      onLoad={(e) => {
        e.target.nextSibling.style.display = 'none';
      }}
    />
  );
}

// フォールバック2: SVG
function SvgUniform({ uniformColor, playerNumber, fallback }) {
  return (
    <div style={{ display: 'none' }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <rect
          x="4" y="4"
          width="16" height="16"
          rx="2"
          fill={uniformColor}
          stroke="white"
          strokeWidth="1.5"
        />
        <rect
          x="2" y="6"
          width="4" height="6"
          rx="1"
          fill={uniformColor}
          stroke="white"
          strokeWidth="1"
        />
        <rect
          x="18" y="6"
          width="4" height="6"
          rx="1"
          fill={uniformColor}
          stroke="white"
          strokeWidth="1"
        />
        <circle
          cx="12" cy="8"
          r="1.5"
          fill="white"
        />
        {playerNumber && (
          <text
            x="12" y="15"
            textAnchor="middle"
            fill="white"
            fontSize="6"
            fontWeight="bold"
          >
            {playerNumber}
          </text>
        )}
      </svg>
      <div style={{ display: 'none' }}>
        {fallback}
      </div>
    </div>
  );
}

// フォールバック3: 四角形（確実に表示される）
function FallbackUniform({ uniformColor, playerNumber }) {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        backgroundColor: uniformColor,
        border: '2px solid white',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '8px',
        fontWeight: 'bold',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      {playerNumber || '?'}
    </div>
  );
}