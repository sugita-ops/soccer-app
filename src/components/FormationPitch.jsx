import { formationMap } from '../lib/formations';

export default function FormationPitch({
  formation = '4-2-3-1',
  players = [],          // 並び順: GK→DF→MF→FWで人数分
  teamUniforms,          // { fpHome, fpAway, gk }
  useAway = false,
}) {
  const key = (formation in formationMap ? formation : '4-2-3-1');
  const layout = formationMap[key];

  const fpImg = useAway ? teamUniforms?.fpAway : teamUniforms?.fpHome;
  const gkImg = teamUniforms?.gk;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-inner"
         style={{aspectRatio:'16/10', background: 'linear-gradient(#3aa76d,#2f8857)'}}>
      {/* ピッチライン */}
      <PitchLines />

      {/* 選手配置 */}
      {layout.map((pos, i) => {
        const p = players[i];
        const img = pos.role === 'GK' ? gkImg : fpImg;
        return (
          <div key={i}
               className="absolute flex flex-col items-center text-white drop-shadow"
               style={{left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)'}}>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 ring-2 ring-white/40 grid place-items-center overflow-hidden">
              {img ? <img src={img} alt="" className="w-12 h-12 object-contain" /> :
                <DefaultShirt role={pos.role} />}
            </div>
            <div className="text-[10px] md:text-xs mt-1 bg-black/30 px-2 py-0.5 rounded">
              {p?.name || '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DefaultShirt({ role }) {
  const color = role === 'GK' ? '#19a974' : '#f5c200';
  return (
    <svg viewBox="0 0 64 64" className="w-10 h-10">
      <path d="M12 10l10-6 10 6 10-6 10 6v12l-6 4-4 24H22l-4-24-6-4V10z" fill={color} stroke="#222" strokeWidth="2"/>
    </svg>
  );
}

function PitchLines(){
  return (
    <>
      {/* 外枠 */}
      <div className="absolute inset-3 rounded-[24px] border-2 border-white/60"></div>
      {/* ハーフウェイ */}
      <div className="absolute left-[50%] top-3 bottom-3 border-l-2 border-white/60"></div>
      {/* センターサークル */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] h-[18%] rounded-full border-2 border-white/60"></div>
      {/* ペナルティ&ゴールエリア（上下） */}
      {[true,false].map((top,i)=>(
        <div key={i} className="absolute left-[22%] right-[22%]"
             style={top?{top:'3%'}:{bottom:'3%'}}>
          <div className="mx-auto w-[56%] aspect-[6/5] border-2 border-white/60"></div>
          <div className="mx-auto mt-1 w-[26%] aspect-[6/4] border-2 border-white/60"></div>
        </div>
      ))}
    </>
  );
}