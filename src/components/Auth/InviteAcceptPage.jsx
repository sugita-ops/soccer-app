import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvitationByToken, acceptInvitation } from '../../lib/invitations'
import { useToast } from '../Toast'

export default function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })

  // 招待情報を読み込み
  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        toast.error('無効な招待リンクです')
        navigate('/')
        return
      }

      try {
        const { data, error } = await getInvitationByToken(token)
        if (error || !data) {
          toast.error(error?.message || '招待リンクが見つかりません')
          navigate('/')
          return
        }

        setInvitation(data)
      } catch (err) {
        toast.error('招待情報の読み込みに失敗しました')
        console.error('Load invitation error:', err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadInvitation()
  }, [token, navigate, toast])

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('お名前を入力してください')
      return false
    }
    if (!formData.password.trim()) {
      toast.error('パスワードを入力してください')
      return false
    }
    if (formData.password.length < 6) {
      toast.error('パスワードは6文字以上で入力してください')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('パスワードが一致しません')
      return false
    }
    return true
  }

  const handleAcceptInvitation = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setAccepting(true)
    try {
      const { data, error } = await acceptInvitation(token, {
        name: formData.name.trim(),
        password: formData.password
      })

      if (error) {
        toast.error(error.message || '招待の承諾に失敗しました')
      } else {
        toast.success('アカウントが作成されました。メール確認後にログインしてください。')
        navigate('/')
      }
    } catch (err) {
      toast.error('招待承諾中にエラーが発生しました')
      console.error('Accept invitation error:', err)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-logo">⚽</div>
          <div style={{textAlign: 'center', color: 'var(--ink-2)'}}>
            招待情報を確認中...
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-logo">❌</div>
          <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>無効な招待</h1>
          <p style={{color: 'var(--ink-2)', marginBottom: '32px'}}>
            招待リンクが無効または期限切れです
          </p>
          <button
            className="primary"
            onClick={() => navigate('/')}
            style={{width: '100%'}}
          >
            トップページに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-logo">🎉</div>
        <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>チームへの招待</h1>
        <p style={{color: 'var(--ink-2)', marginBottom: '24px'}}>
          宮中サッカー部チーム管理システムへようこそ
        </p>

        <div style={{
          padding: '16px',
          background: '#f0f9f0',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #d4edda'
        }}>
          <div style={{fontSize: '14px'}}>
            <div><strong>招待先:</strong> {invitation.email}</div>
            <div><strong>権限:</strong> {
              invitation.role === 'admin' ? '管理者' :
              invitation.role === 'coach' ? 'コーチ' : '保護者'
            }</div>
            <div><strong>招待者:</strong> {invitation.invited_by_profile?.name || '不明'}</div>
          </div>
        </div>

        <form onSubmit={handleAcceptInvitation} className="stack">
          <div>
            <label>お名前</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="山田 太郎"
              required
            />
          </div>

          <div>
            <label>パスワード</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="6文字以上のパスワード"
              required
            />
          </div>

          <div>
            <label>パスワード（確認）</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="パスワードを再入力"
              required
            />
          </div>

          <div className="actions">
            <button
              type="submit"
              className="primary"
              disabled={accepting}
              style={{width: '100%'}}
            >
              {accepting ? '登録中...' : '招待を承諾してアカウント作成'}
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => navigate('/')}
              style={{width: '100%', marginTop: '8px'}}
            >
              キャンセル
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '24px',
          fontSize: '12px',
          color: 'var(--ink-2)',
          textAlign: 'center'
        }}>
          アカウント作成後、メール認証が必要です
        </div>
      </div>
    </div>
  )
}