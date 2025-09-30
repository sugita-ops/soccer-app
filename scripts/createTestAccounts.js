import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// .env.localファイルから環境変数を読み込み
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY

console.log('🚀 Creating test accounts in Supabase...')
console.log('Supabase URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testAccounts = [
  {
    email: 'coach.tanaka@gmail.com',
    password: 'coach123',
    name: '田中コーチ',
    role: 'coach'
  },
  {
    email: 'admin.yamada@gmail.com',
    password: 'admin123',
    name: '山田部長',
    role: 'admin'
  },
  {
    email: 'parent.sato@gmail.com',
    password: 'parent123',
    name: '佐藤保護者',
    role: 'parent'
  },
  {
    email: 'parent.suzuki@gmail.com',
    password: 'parent123',
    name: '鈴木保護者',
    role: 'parent'
  }
]

async function createTestAccount(account) {
  console.log(`\n👤 Creating account: ${account.name} (${account.email})`)

  try {
    // アカウント作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          name: account.name
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`✅ Account already exists: ${account.email}`)
        return { success: true, existed: true }
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user data returned from signup')
    }

    console.log(`✅ Auth account created: ${authData.user.id}`)

    // プロフィール作成（手動でSupabaseが確認無しに作成）
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: account.name,
        role: account.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (profileError) {
      console.warn(`⚠️ Profile creation warning:`, profileError.message)
      // プロフィールエラーは警告のみ（テーブルが存在しない可能性）
    } else {
      console.log(`✅ Profile created for: ${account.name}`)
    }

    return { success: true, user: authData.user, existed: false }

  } catch (error) {
    console.error(`❌ Failed to create account ${account.email}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('\n🎯 Starting test account creation...\n')

  const results = []

  for (const account of testAccounts) {
    const result = await createTestAccount(account)
    results.push({ account, result })

    // レート制限を避けるために少し待機
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n📊 Summary:')
  console.log('=' * 50)

  const successful = results.filter(r => r.result.success)
  const failed = results.filter(r => !r.result.success)
  const existed = results.filter(r => r.result.success && r.result.existed)

  console.log(`✅ Successful: ${successful.length}/${testAccounts.length}`)
  console.log(`🔄 Already existed: ${existed.length}`)
  console.log(`❌ Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\n❌ Failed accounts:')
    failed.forEach(f => {
      console.log(`  - ${f.account.email}: ${f.result.error}`)
    })
  }

  console.log('\n🎉 Test account creation completed!')
  console.log('\n💡 Next steps:')
  console.log('1. Check your email for confirmation links (if email confirmation is enabled)')
  console.log('2. Test the Quick Login feature in your app')
  console.log('3. If emails need confirmation, you can manually confirm them in Supabase dashboard')
}

main().catch(console.error)