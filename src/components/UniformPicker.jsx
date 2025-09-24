import { useState, useEffect } from 'react';
import { loadJSON, saveJSON } from '../lib/jsonStore'; // 既存の永続化レイヤー

// 保存キー: teamUniforms.<teamId> = { fpHome, fpAway, gk }
export default function UniformPicker({ teamId='default' }) {
  const [uniforms, setUniforms] = useState({ fpHome:'', fpAway:'', gk:'' });

  useEffect(() => {
    const data = loadJSON();
    const saved = data.teamUniforms?.[teamId] || {};
    setUniforms({ fpHome: saved.fpHome || '', fpAway: saved.fpAway || '', gk: saved.gk || '' });
  }, [teamId]);

  const onSelect = (key) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toDataURL(file);
    const next = { ...uniforms, [key]: b64 };
    setUniforms(next);

    // JSONStore形式で保存
    const data = loadJSON();
    if (!data.teamUniforms) data.teamUniforms = {};
    data.teamUniforms[teamId] = next;
    saveJSON(data);
  };

  return (
    <div className="rounded-xl border p-4 bg-white/60 space-y-3">
      <h3 className="font-semibold">ユニフォーム設定</h3>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <Picker label="FP（ホーム）" value={uniforms.fpHome} onChange={onSelect('fpHome')} />
        <Picker label="FP（アウェイ）" value={uniforms.fpAway} onChange={onSelect('fpAway')} />
        <Picker label="GK" value={uniforms.gk} onChange={onSelect('gk')} />
      </div>
      <p className="text-xs text-gray-500">※ PNG/SVG推奨。保存は端末に永続化され、JSONエクスポートにも含まれます。</p>
    </div>
  );
}

function Picker({ label, value, onChange }) {
  return (
    <label className="flex flex-col items-center gap-2">
      <span>{label}</span>
      <div className="w-16 h-16 rounded-md border bg-white grid place-items-center overflow-hidden">
        {value ? <img alt="" src={value} className="w-full h-full object-contain" /> : <span className="text-gray-400 text-xs">No Img</span>}
      </div>
      <input type="file" accept="image/*" onChange={onChange} className="text-xs" />
    </label>
  );
}

function toDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}