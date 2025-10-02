import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser, signOut, signInWithEmail, isSupabaseAvailable } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // プロフィール情報を取得
  const fetchProfile = async (userId) => {
    if (!isSupabaseAvailable()) {
      return null
    }

    try {
      // タイムアウト付きでプロフィール取得
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒タイムアウト

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error && error.code !== 'PGRST116') { // Not found error is ok for new users
        console.warn('Profile fetch error (continuing without profile):', error.message)
        // エラーをセットせずに null を返す（プロフィールなしでも動作）
        return null
      }

      return data
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('Profile fetch timeout, continuing without profile')
      } else {
        console.warn('Profile fetch error (continuing without profile):', err.message)
      }
      return null
    }
  }

  // ユーザーセッションの管理
  useEffect(() => {
    // Supabaseが利用できない場合は即座にローディング完了
    if (!isSupabaseAvailable()) {
      setLoading(false)
      return
    }

    // 初期セッションの取得
    const getInitialSession = async () => {
      try {
        // セッション取得にタイムアウトを設定
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        )

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

        if (error) {
          console.error('Session error:', error)
          setError(error.message)
        } else if (session) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (err) {
        console.error('Initial session error:', err.message)
        // セッション取得エラーでもローディングを終了
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        if (session) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
        setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ログイン
  const signIn = async (email, password) => {
    if (!isSupabaseAvailable()) {
      throw new Error('Supabaseが利用できません')
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await signInWithEmail(email, password)

      if (error) {
        setError(error.message)
        throw error
      }

      // AuthStateChangeで自動的にuser/profileが設定される
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ログアウト
  const logout = async () => {
    try {
      setLoading(true)
      const { error } = await signOut()
      if (error) {
        setError(error.message)
        return { error }
      }
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  // プロフィール情報の更新
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
        return { data: null, error }
      }

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    logout,
    updateProfile,
    fetchProfile,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}