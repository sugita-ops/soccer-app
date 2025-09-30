import { useState } from 'react'
import { signInWithEmail, resetPassword } from '../../lib/supabase'
import { useToast } from '../Toast'

export default function LoginForm({ onSwitchToSignup, onSwitchToQuick }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const toast = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('メールアドレスとパスワードを入力してください')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signInWithEmail(email, password)

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('メールアドレスが確認されていません。受信箱をご確認ください。')
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('メールアドレスまたはパスワードが正しくありません')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('ログインしました')
    } catch (err) {
      toast.error('ログインに失敗しました')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('メールアドレスを入力してください')
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword(email)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('パスワードリセット用のメールを送信しました')
        setShowResetPassword(false)
      }
    } catch (err) {
      toast.error('パスワードリセットに失敗しました')
      console.error('Password reset error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <div className="login-card fade-in">
        <div className="login-logo">🔑</div>
        <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>パスワードリセット</h1>
        <p style={{color: 'var(--ink-2)', marginBottom: '32px'}}>
          登録したメールアドレスを入力してください
        </p>

        <form onSubmit={handleResetPassword} className="stack">
          <div>
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="actions">
            <button
              type="submit"
              className="primary"
              disabled={loading}
              style={{width: '100%'}}
            >
              {loading ? 'リセット中...' : 'リセットメールを送信'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowResetPassword(false)}
              style={{width: '100%'}}
            >
              ログインに戻る
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="login-card fade-in">
      <div className="login-logo">⚽</div>
      <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>宮中サッカー部</h1>
      <p style={{color: 'var(--ink-2)', marginBottom: '32px'}}>
        管理システムにログイン
      </p>

      <form onSubmit={handleLogin} className="stack">
        <div>
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />
        </div>

        <div>
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            required
          />
        </div>

        <div className="actions">
          <button
            type="submit"
            className="primary"
            disabled={loading}
            style={{width: '100%'}}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          <div style={{textAlign: 'center', marginTop: '16px'}}>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowResetPassword(true)}
              style={{fontSize: '14px', padding: '4px 8px'}}
            >
              パスワードを忘れた方
            </button>
          </div>

          <div style={{textAlign: 'center', marginTop: '8px'}}>
            <span style={{fontSize: '14px', color: 'var(--ink-2)'}}>
              アカウントをお持ちでない方は{' '}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={onSwitchToSignup}
              style={{fontSize: '14px', padding: '0', textDecoration: 'underline'}}
            >
              新規登録
            </button>
          </div>

          {onSwitchToQuick && (
            <div style={{textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)'}}>
              <button
                type="button"
                className="ghost"
                onClick={onSwitchToQuick}
                style={{fontSize: '14px', padding: '8px 16px', color: 'var(--brand)'}}
              >
                ⚡ クイックログインに戻る
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}