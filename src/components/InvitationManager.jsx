import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createInvitation, getInvitations, cancelInvitation, resendInvitation } from '../lib/invitations'
import { useToast } from './Toast'

export default function InvitationManager() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'parent'
  })

  // 招待一覧を読み込み
  const loadInvitations = async () => {
    setLoading(true)
    try {
      const { data, error } = await getInvitations()
      if (error) {
        toast.error('招待一覧の読み込みに失敗しました')
        console.error('Load invitations error:', error)
      } else {
        setInvitations(data || [])
      }
    } catch (err) {
      toast.error('招待一覧の読み込み中にエラーが発生しました')
      console.error('Load invitations exception:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadInvitations()
    }
  }, [user, profile])

  // 新規招待を送信
  const handleSendInvitation = async (e) => {
    e.preventDefault()

    if (!newInvitation.email.trim()) {
      toast.error('メールアドレスを入力してください')
      return
    }

    if (!newInvitation.email.includes('@')) {
      toast.error('有効なメールアドレスを入力してください')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await createInvitation(
        newInvitation.email.trim(),
        newInvitation.role,
        user.id
      )

      if (error) {
        toast.error('招待の送信に失敗しました')
        console.error('Send invitation error:', error)
      } else {
        toast.success('招待メールを送信しました')
        setNewInvitation({ email: '', role: 'parent' })
        loadInvitations() // 一覧を更新
      }
    } catch (err) {
      toast.error('招待送信中にエラーが発生しました')
      console.error('Send invitation exception:', err)
    } finally {
      setLoading(false)
    }
  }

  // 招待を取り消し
  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('この招待を取り消しますか？')) return

    setLoading(true)
    try {
      const { error } = await cancelInvitation(invitationId)
      if (error) {
        toast.error('招待の取り消しに失敗しました')
      } else {
        toast.success('招待を取り消しました')
        loadInvitations() // 一覧を更新
      }
    } catch (err) {
      toast.error('招待取り消し中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 招待を再送信
  const handleResendInvitation = async (invitationId) => {
    if (!confirm('招待メールを再送信しますか？')) return

    setLoading(true)
    try {
      const { error } = await resendInvitation(invitationId)
      if (error) {
        toast.error('招待の再送信に失敗しました')
      } else {
        toast.success('招待メールを再送信しました')
        loadInvitations() // 一覧を更新
      }
    } catch (err) {
      toast.error('招待再送信中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 管理者以外はアクセス不可
  if (profile?.role !== 'admin') {
    return null
  }

  return (
    <section className="card-enhanced">
      <h2>👥 ユーザー招待管理</h2>
      <div className="kicker" style={{marginBottom: 16}}>
        新しいメンバーをメールで招待してチームに追加できます
      </div>

      <div className="stack" style={{gap: 16}}>
        {/* 新規招待フォーム */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>📧 新規招待</h3>

          <form onSubmit={handleSendInvitation} className="stack" style={{gap: 12}}>
            <div className="row-3">
              <div>
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={newInvitation.email}
                  onChange={e => setNewInvitation(prev => ({...prev, email: e.target.value}))}
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <label>権限ロール</label>
                <select
                  value={newInvitation.role}
                  onChange={e => setNewInvitation(prev => ({...prev, role: e.target.value}))}
                >
                  <option value="parent">保護者</option>
                  <option value="coach">コーチ</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div style={{display: 'flex', alignItems: 'end'}}>
                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                  style={{whiteSpace: 'nowrap'}}
                >
                  {loading ? '送信中...' : '📧 招待送信'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 招待一覧 */}
        <div className="card" style={{padding: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <h3 style={{fontSize: '16px', margin: 0}}>📋 招待一覧</h3>
            <button
              className="ghost"
              onClick={loadInvitations}
              disabled={loading}
              style={{fontSize: '12px', padding: '4px 8px'}}
            >
              {loading ? '更新中...' : '🔄 更新'}
            </button>
          </div>

          {invitations.length === 0 ? (
            <div className="kicker">送信した招待はありません</div>
          ) : (
            <div className="list">
              {invitations.map(invitation => (
                <div key={invitation.id} style={{
                  padding: '12px',
                  background: invitation.status === 'accepted' ? '#f0f9f0' : '#f8f9fa',
                  border: `1px solid ${invitation.status === 'accepted' ? '#d4edda' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                        <strong>{invitation.email}</strong>
                        <span className={`badge ${invitation.status === 'pending' ? 'warning' : invitation.status === 'accepted' ? 'success' : 'error'}`}>
                          {invitation.status === 'pending' ? '招待中' :
                           invitation.status === 'accepted' ? '承諾済み' : '取り消し済み'}
                        </span>
                      </div>

                      <div style={{fontSize: '14px', color: 'var(--ink-2)', marginBottom: 4}}>
                        <span>権限: {invitation.role === 'admin' ? '管理者' : invitation.role === 'coach' ? 'コーチ' : '保護者'}</span>
                        {' | '}
                        <span>招待者: {invitation.invited_by_profile?.name || '不明'}</span>
                      </div>

                      <div style={{fontSize: '12px', color: 'var(--ink-2)'}}>
                        <div>送信日時: {new Date(invitation.created_at).toLocaleString('ja-JP')}</div>
                        <div>有効期限: {new Date(invitation.expires_at).toLocaleString('ja-JP')}</div>
                        {invitation.accepted_at && (
                          <div>承諾日時: {new Date(invitation.accepted_at).toLocaleString('ja-JP')}</div>
                        )}
                      </div>
                    </div>

                    {invitation.status === 'pending' && (
                      <div style={{display: 'flex', gap: 4}}>
                        <button
                          className="ghost"
                          onClick={() => handleResendInvitation(invitation.id)}
                          disabled={loading}
                          style={{fontSize: '12px', padding: '4px 8px'}}
                        >
                          再送信
                        </button>
                        <button
                          className="ghost"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={loading}
                          style={{fontSize: '12px', padding: '4px 8px', color: 'var(--danger)'}}
                        >
                          取り消し
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div style={{
          padding: '12px',
          background: '#fffaf0',
          border: '1px solid #fbd38d',
          borderRadius: '8px'
        }}>
          <div style={{fontSize: '14px', color: '#744210'}}>
            <strong>📝 招待について:</strong>
            <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>招待リンクは7日間有効です</li>
              <li>招待メールが届かない場合は、迷惑メールフォルダを確認してもらってください</li>
              <li>開発環境では実際のメール送信は行われません（コンソールに出力）</li>
              <li>招待されたユーザーは招待リンクからアカウントを作成できます</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}