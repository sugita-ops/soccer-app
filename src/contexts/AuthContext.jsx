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

  // プロフィール情報を取得（高速化）
  const fetchProfile = async (userId) => {
    if (!isSupabaseAvailable()) {
      return null
    }

    try {
      // より短いタイムアウトで高速化
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2秒に短縮

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch error (skipping profile):', error.message)
        return null
      }

      return data
    } catch (err) {
      // エラーは警告のみ、プロフィールなしで続行
      console.warn('Profile fetch failed, continuing without profile')
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

    // 初期セッションの取得（高速化）
    const getInitialSession = async () => {
      try {
        // より短いタイムアウトで高速化
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000) // 3秒に短縮
        )

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

        if (error) {
          console.warn('Session error (skipping):', error.message)
          // エラーでもローディング終了（認証なしで続行）
        } else if (session) {
          setUser(session.user)
          // プロフィール取得を非同期で実行（ローディング終了を遅らせない）
          fetchProfile(session.user.id).then(setProfile)
        }
      } catch (err) {
        console.warn('Initial session timeout, continuing without auth:', err.message)
        // タイムアウトでも続行
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