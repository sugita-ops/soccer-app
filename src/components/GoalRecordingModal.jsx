import { useState, useEffect } from 'react';

export default function GoalRecordingModal({
  players = [],
  onSave,
  onClose,
  existingGoal = null
}) {
  const [goalData, setGoalData] = useState({
    minute: '',
    scorer: '',
    assist: '',
    noAssist: false
  });

  // existingGoalが変更されたら状態を更新
  useEffect(() => {
    if (existingGoal) {
      setGoalData(existingGoal);
    } else {
      setGoalData({
        minute: '',
        scorer: '',
        assist: '',
        noAssist: false
      });
    }
  }, [existingGoal]);

  const playerOptions = players
    .slice()
    .sort((a, b) => (a.number || 0) - (b.number || 0))
    .map(p => ({
      value: p.id,
      label: p.number ? `#${p.number} ${p.name}` : p.name
    }));

  const handleSave = () => {
    console.log('🔍 Goal Data:', goalData);
    console.log('🔍 Minute:', goalData.minute, 'Type:', typeof goalData.minute);
    console.log('🔍 Scorer:', goalData.scorer, 'Type:', typeof goalData.scorer);

    if (!goalData.minute || !goalData.scorer) {
      alert(`時間と得点者を入力してください\n時間: "${goalData.minute}"\n得点者: "${goalData.scorer}"`);
      return;
    }

    const goal = {
      id: existingGoal?.id || crypto.randomUUID(),
      minute: parseInt(goalData.minute),
      scorer: goalData.scorer,
      assist: goalData.noAssist ? null : (goalData.assist || null)
    };

    console.log('✅ Saving goal:', goal);
    onSave(goal);
  };

  const handleNoAssistChange = (checked) => {
    setGoalData(prev => ({
      ...prev,
      noAssist: checked,
      assist: checked ? '' : prev.assist
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{
          fontSize: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚽ 得点記録
        </h3>

        {/* 時間入力 */}
        <div style={{marginBottom: '16px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '6px',
            color: '#374151'
          }}>
            時間（分）<span style={{color: '#ef4444'}}>*</span>
          </label>
          <input
            type="number"
            value={goalData.minute}
            onChange={e => setGoalData(prev => ({...prev, minute: e.target.value}))}
            placeholder="45"
            min="0"
            max="120"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* 得点者選択 */}
        <div style={{marginBottom: '16px'}}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '6px',
            color: '#374151'
          }}>
            得点者<span style={{color: '#ef4444'}}>*</span>
          </label>
          <select
            value={goalData.scorer}
            onChange={e => setGoalData(prev => ({...prev, scorer: e.target.value}))}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px'
            }}
          >
            <option value="">選手を選択...</option>
            {playerOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* アシストなしチェックボックス */}
        <div style={{marginBottom: '16px'}}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={goalData.noAssist}
              onChange={e => handleNoAssistChange(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
            <span>アシストなし</span>
          </label>
        </div>

        {/* アシスト選択 */}
        {!goalData.noAssist && (
          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#374151'
            }}>
              アシスト（任意）
            </label>
            <select
              value={goalData.assist}
              onChange={e => setGoalData(prev => ({...prev, assist: e.target.value}))}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            >
              <option value="">選手を選択...</option>
              {playerOptions
                .filter(opt => opt.value !== goalData.scorer)
                .map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          </div>
        )}

        {/* ボタン */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--brand)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {existingGoal ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  );
}
