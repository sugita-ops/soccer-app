import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase環境変数がない場合はnullを返す（JSONStoreで動作）
export const supabase = (!supabaseUrl || !supabaseAnonKey) ? null : createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Supabase が利用可能かどうかのチェック
export const isSupabaseAvailable = () => supabase !== null

// 認証状態の管理
export const getCurrentUser = () => {
  if (!supabase) return Promise.resolve({ data: { user: null }, error: null })
  return supabase.auth.getUser()
}
export const getSession = () => {
  if (!supabase) return Promise.resolve({ data: { session: null }, error: null })
  return supabase.auth.getSession()
}

// メール認証でのサインアップ
export const signUpWithEmail = async (email, password, userData = {}) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

// メール/パスワードでのサインイン
export const signInWithEmail = async (email, password) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

// サインアウト
export const signOut = async () => {
  if (!supabase) return { error: null }
  const { error } = await supabase.auth.signOut()
  return { error }
}

// パスワードリセット
export const resetPassword = async (email) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { data, error }
}

// メール確認の再送信
export const resendEmailConfirmation = async (email) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email
  })
  return { data, error }
}