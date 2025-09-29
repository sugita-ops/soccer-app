import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { migrateDataToSupabase, loadDataFromSupabase, syncDataBidirectional } from '../lib/migration'
import { useToast } from './Toast'

export default function DataMigration() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResults, setMigrationResults] = useState(null)

  const handleMigration = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setIsLoading(true)
    setMigrationResults(null)

    try {
      const result = await migrateDataToSupabase(user.id)
      setMigrationResults(result)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('移行中にエラーが発生しました')
      console.error('Migration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setIsLoading(true)

    try {
      const result = await syncDataBidirectional(user.id)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('同期中にエラーが発生しました')
      console.error('Sync error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadFromSupabase = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setIsLoading(true)

    try {
      const result = await loadDataFromSupabase()

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('読み込み中にエラーが発生しました')
      console.error('Load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="card-enhanced">
      <h2>🔄 データ移行・同期</h2>
      <div className="kicker" style={{marginBottom: 16}}>
        ローカルデータとSupabaseクラウドデータベース間のデータ移行・同期機能
      </div>

      <div className="stack" style={{gap: 16}}>
        {/* 移行機能 */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>📤 ローカル → Supabaseに移行</h3>
          <p style={{fontSize: '14px', color: 'var(--ink-2)', marginBottom: 12}}>
            現在のローカルデータ（選手・試合記録）をSupabaseクラウドデータベースに移行します。
          </p>
          <div className="actions">
            <button
              className="primary"
              onClick={handleMigration}
              disabled={isLoading}
            >
              {isLoading ? '移行中...' : '📤 データを移行'}
            </button>
          </div>
        </div>

        {/* 同期機能 */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>🔄 双方向同期</h3>
          <p style={{fontSize: '14px', color: 'var(--ink-2)', marginBottom: 12}}>
            ローカルとSupabase間で新しいデータを相互に同期します。
          </p>
          <div className="actions">
            <button
              className="primary"
              onClick={handleSync}
              disabled={isLoading}
            >
              {isLoading ? '同期中...' : '🔄 データを同期'}
            </button>
          </div>
        </div>

        {/* Supabaseから読み込み */}
        <div className="card" style={{padding: 16}}>
          <h3 style={{fontSize: '16px', marginBottom: 12}}>📥 Supabase → ローカルに読み込み</h3>
          <p style={{fontSize: '14px', color: 'var(--ink-2)', marginBottom: 12}}>
            Supabaseからデータを読み込んで確認します（ローカルデータは変更されません）。
          </p>
          <div className="actions">
            <button
              className="ghost"
              onClick={handleLoadFromSupabase}
              disabled={isLoading}
            >
              {isLoading ? '読み込み中...' : '📥 データを確認'}
            </button>
          </div>
        </div>

        {/* 移行結果の表示 */}
        {migrationResults && (
          <div className="card" style={{padding: 16}}>
            <h3 style={{fontSize: '16px', marginBottom: 12}}>📊 移行結果</h3>

            {migrationResults.success ? (
              <div style={{
                padding: '12px',
                background: '#f0f9f0',
                border: '1px solid #d4edda',
                borderRadius: '8px',
                marginBottom: 12
              }}>
                <div style={{color: '#155724', fontSize: '14px'}}>
                  <strong>✅ 移行完了</strong>
                  <div style={{marginTop: 8}}>
                    <div>選手データ: {migrationResults.results.players.success}件成功, {migrationResults.results.players.failed}件失敗</div>
                    <div>試合データ: {migrationResults.results.matches.success}件成功, {migrationResults.results.matches.failed}件失敗</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px',
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                borderRadius: '8px',
                marginBottom: 12
              }}>
                <div style={{color: '#c53030', fontSize: '14px'}}>
                  <strong>❌ 移行失敗</strong>
                  <div style={{marginTop: 8}}>
                    {migrationResults.message}
                  </div>
                </div>
              </div>
            )}

            {migrationResults.results?.errors && migrationResults.results.errors.length > 0 && (
              <div style={{marginTop: 12}}>
                <strong style={{fontSize: '14px'}}>エラー詳細:</strong>
                <div className="list" style={{marginTop: 8}}>
                  {migrationResults.results.errors.map((error, index) => (
                    <div key={index} style={{
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#c53030'
                    }}>
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 注意事項 */}
        <div style={{
          padding: '12px',
          background: '#fffaf0',
          border: '1px solid #fbd38d',
          borderRadius: '8px'
        }}>
          <div style={{fontSize: '14px', color: '#744210'}}>
            <strong>⚠️ 注意事項:</strong>
            <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>移行前にローカルデータをバックアップしてください</li>
              <li>移行は一度に大量のデータを処理するため、時間がかかる場合があります</li>
              <li>管理者権限が必要な機能があります</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}