import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './QuickLogin.css';

const QuickLogin = ({ onToggle }) => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // クイックログイン用のプリセットアカウント
  const quickAccounts = [
    {
      id: 'test-user',
      name: '杉田テストユーザー',
      email: 'k.sugita0360@icloud.com',
      password: 'kmsk0630',
      role: 'テストユーザー',
      avatar: '🧪',
      description: 'テスト用アカウント'
    },
    {
      id: 'coach',
      name: '田中コーチ',
      email: 'coach.tanaka@gmail.com',
      password: 'coach123',
      role: 'コーチ',
      avatar: '🏃',
      description: 'チーム管理・戦術指導'
    },
    {
      id: 'admin',
      name: '山田部長',
      email: 'admin.yamada.test@gmail.com',
      password: 'admin123',
      role: '管理者',
      avatar: '👑',
      description: '全権限・ユーザー管理'
    },
    {
      id: 'parent1',
      name: '佐藤保護者',
      email: 'parent.sato@gmail.com',
      password: 'parent123',
      role: '保護者',
      avatar: '👨‍👩‍👧‍👦',
      description: '試合観戦・応援'
    }
  ];

  const handleQuickLogin = async (account) => {
    setIsLoading(true);
    setSelectedAccount(account.id);

    try {
      await signIn(account.email, account.password);
    } catch (error) {
      console.error('クイックログイン失敗:', error);
      alert(`ログインに失敗しました: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSelectedAccount(null);
    }
  };

  return (
    <div className="quick-login-container">
      <div className="quick-login-header">
        <h2>⚡ クイックログイン</h2>
        <p>テスト用アカウントで素早くログイン</p>
      </div>

      <div className="quick-accounts-grid">
        {quickAccounts.map(account => (
          <div
            key={account.id}
            className={`quick-account-card ${selectedAccount === account.id ? 'loading' : ''}`}
            onClick={() => !isLoading && handleQuickLogin(account)}
          >
            <div className="account-avatar">
              {selectedAccount === account.id ? '⏳' : account.avatar}
            </div>

            <div className="account-info">
              <div className="account-name">{account.name}</div>
              <div className="account-role">{account.role}</div>
              <div className="account-description">{account.description}</div>
            </div>

            <div className="account-details">
              <div className="account-email">{account.email}</div>
            </div>

            {selectedAccount === account.id && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <span>ログイン中...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="quick-login-divider">
        <span>または</span>
      </div>

      <div className="quick-login-actions">
        <button
          className="ghost"
          onClick={onToggle}
          disabled={isLoading}
        >
          📧 メール・パスワードでログイン
        </button>
      </div>

      <div className="quick-login-note">
        <p>
          💡 <strong>開発・テスト用機能</strong><br/>
          本番環境では実際のアカウントでログインしてください
        </p>
      </div>

    </div>
  );
};

export default QuickLogin;