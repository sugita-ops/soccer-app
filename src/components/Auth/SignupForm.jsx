import { useState } from 'react'
import { signUpWithEmail, resendEmailConfirmation } from '../../lib/supabase'
import { useToast } from '../Toast'

export default function SignupForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const toast = useToast()

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('名前を入力してください')
      return false
    }
    if (!formData.email.trim()) {
      toast.error('メールアドレスを入力してください')
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

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const { data, error } = await signUpWithEmail(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: 'parent' // デフォルトは保護者権限
        }
      )

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('このメールアドレスは既に登録されています')
        } else {
          toast.error(error.message)
        }
        return
      }

      setRegisteredEmail(formData.email)
      setShowConfirmation(true)
      toast.success('登録メールを送信しました。メールボックスをご確認ください。')

    } catch (err) {
      toast.error('登録に失敗しました')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!registeredEmail) return

    setLoading(true)
    try {
      const { error } = await resendEmailConfirmation(registeredEmail)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('確認メールを再送信しました')
      }
    } catch (err) {
      toast.error('メールの再送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="login-card fade-in">
        <div className="login-logo">📧</div>
        <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>メール確認</h1>
        <p style={{color: 'var(--ink-2)', marginBottom: '24px'}}>
          <strong>{registeredEmail}</strong> にメール確認リンクを送信しました。
        </p>

        <div style={{
          padding: '16px',
          background: '#f0f9f0',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #d4edda'
        }}>
          <div style={{fontSize: '14px', lineHeight: '1.5'}}>
            <p><strong>次の手順に従ってください：</strong></p>
            <ol style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>メールボックス（迷惑メールフォルダも含む）を確認</li>
              <li>確認リンクをクリック</li>
              <li>ログイン画面に戻ってログイン</li>
            </ol>
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={onSwitchToLogin}
            style={{width: '100%'}}
          >
            ログイン画面に戻る
          </button>

          <button
            type="button"
            className="ghost"
            onClick={handleResendEmail}
            disabled={loading}
            style={{width: '100%', marginTop: '8px'}}
          >
            {loading ? '再送信中...' : '確認メールを再送信'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-card fade-in">
      <div className="login-logo">🆕</div>
      <h1 style={{color: 'var(--ink)', marginBottom: '8px'}}>新規登録</h1>
      <p style={{color: 'var(--ink-2)', marginBottom: '32px'}}>
        アカウントを作成してチームに参加
      </p>

      <form onSubmit={handleSignup} className="stack">
        <div>
          <label>お名前</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="山田 太郎"
            required
          />
        </div>

        <div>
          <label>メールアドレス</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            required
          />
        </div>

        <div>
          <label>パスワード</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="パスワードを再入力"
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
            {loading ? '登録中...' : 'アカウント作成'}
          </button>

          <div style={{textAlign: 'center', marginTop: '16px'}}>
            <span style={{fontSize: '14px', color: 'var(--ink-2)'}}>
              既にアカウントをお持ちの方は{' '}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={onSwitchToLogin}
              style={{fontSize: '14px', padding: '0', textDecoration: 'underline'}}
            >
              ログイン
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}