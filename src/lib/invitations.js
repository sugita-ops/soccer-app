import { supabase } from './supabase'

// 招待トークンを生成
const generateInviteToken = () => {
  return crypto.randomUUID()
}

// 招待の作成
export const createInvitation = async (email, role, invitedBy) => {
  try {
    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // メール送信（実際の実装では外部メールサービスを使用）
    await sendInvitationEmail(email, token, role)

    return { data, error: null }
  } catch (error) {
    console.error('Invitation creation error:', error)
    return { data: null, error }
  }
}

// 招待メールの送信（モック実装）
const sendInvitationEmail = async (email, token, role) => {
  // 実際の実装では、SendGrid、Resend、またはSupabaseのEdge Functionsを使用
  const inviteUrl = `${window.location.origin}/invite/${token}`

  console.log('招待メール送信（モック）:', {
    to: email,
    subject: '宮中サッカー部への招待',
    body: `
      宮中サッカー部チーム管理システムへの招待です。

      役割: ${role === 'admin' ? '管理者' : role === 'coach' ? 'コーチ' : '保護者'}

      以下のリンクからアカウントを作成してください：
      ${inviteUrl}

      ※このリンクは7日間有効です。
    `
  })

  // 開発環境では実際のメール送信をスキップ
  return Promise.resolve()
}

// 招待一覧の取得
export const getInvitations = async () => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by_profile:invited_by(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Get invitations error:', error)
    return { data: null, error }
  }
}

// 招待の詳細取得（トークンベース）
export const getInvitationByToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by_profile:invited_by(name)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (error) throw error

    // 有効期限チェック
    if (new Date(data.expires_at) < new Date()) {
      return { data: null, error: { message: '招待リンクの有効期限が切れています' } }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get invitation by token error:', error)
    return { data: null, error }
  }
}

// 招待の承諾
export const acceptInvitation = async (token, userData) => {
  try {
    // 招待情報を取得
    const { data: invitation, error: inviteError } = await getInvitationByToken(token)
    if (inviteError || !invitation) {
      throw new Error('無効な招待リンクです')
    }

    // ユーザーアカウントを作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: invitation.role
        }
      }
    })

    if (authError) throw authError

    // 招待ステータスを更新
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('token', token)

    if (updateError) {
      console.error('Invitation status update error:', updateError)
    }

    return { data: authData, error: null }
  } catch (error) {
    console.error('Accept invitation error:', error)
    return { data: null, error }
  }
}

// 招待の取り消し
export const cancelInvitation = async (invitationId) => {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Cancel invitation error:', error)
    return { data: null, error }
  }
}

// 招待の再送信
export const resendInvitation = async (invitationId) => {
  try {
    // 新しいトークンと有効期限を生成
    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('invitations')
      .update({
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .eq('id', invitationId)
      .select()
      .single()

    if (error) throw error

    // メール再送信
    await sendInvitationEmail(data.email, token, data.role)

    return { data, error: null }
  } catch (error) {
    console.error('Resend invitation error:', error)
    return { data: null, error }
  }
}