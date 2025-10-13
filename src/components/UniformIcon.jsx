// SVGユニフォームアイコンコンポーネント
// 提供された画像を参考にしたTシャツ型デザイン

// 色の定義
export const UNIFORM_COLORS = {
  blue: '#2196F3',
  red: '#F44336',
  white: '#FFFFFF',
  yellow: '#FDD835',
  green: '#4CAF50',
  black: '#212121'
};

// FPの色に対応するGKの色の組み合わせ
export const GK_COLOR_MAP = {
  blue: 'yellow',
  red: 'black',
  white: 'green',
  yellow: 'black',
  green: 'yellow',
  black: 'yellow'
};

export default function UniformIcon({
  colorName = 'blue',  // 色名: 'blue', 'red', 'white', 'yellow', 'green', 'black'
  number = '',          // 背番号
  size = 24            // アイコンサイズ（px）
}) {
  const color = UNIFORM_COLORS[colorName] || UNIFORM_COLORS.blue;
  const strokeColor = colorName === 'white' ? '#333333' : '#FFFFFF';
  const numberColor = colorName === 'white' ? '#333333' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        display: 'block'
      }}
    >
      {/* Tシャツの本体 */}
      <path
        d="M 12 12 L 8 18 L 8 28 L 12 28 L 12 44 L 36 44 L 36 28 L 40 28 L 40 18 L 36 12 L 30 12 L 30 16 L 18 16 L 18 12 Z"
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 袖（左） */}
      <path
        d="M 12 12 L 8 18 L 4 20 L 2 16 L 6 10 L 12 12"
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 袖（右） */}
      <path
        d="M 36 12 L 40 18 L 44 20 L 46 16 L 42 10 L 36 12"
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 襟 */}
      <ellipse
        cx="24"
        cy="14"
        rx="4"
        ry="3"
        fill={color}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* 背番号 */}
      {number && (
        <text
          x="24"
          y="32"
          textAnchor="middle"
          fill={numberColor}
          fontSize="14"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  );
}

// 選手が未配置の場合のプレースホルダー
export function UniformPlaceholder({ size = 24 }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(128,128,128,0.5)',
        border: '2px solid rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: `${size / 3}px`,
        fontWeight: 'bold'
      }}
    >
      ?
    </div>
  );
}
