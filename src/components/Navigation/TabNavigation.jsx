import React, { useState } from 'react';
import './TabNavigation.css';

const TabNavigation = ({ children, defaultTab = 'match' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = [
    { id: 'match', label: '試合記録', icon: '⚽' },
    { id: 'players', label: '選手管理', icon: '👥' },
    { id: 'history', label: '試合履歴', icon: '📊' },
    { id: 'stats', label: '統計', icon: '📈' },
    { id: 'settings', label: '設定', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    return React.Children.map(children, child => {
      if (child.props.tabId === activeTab) {
        return child;
      }
      return null;
    });
  };

  return (
    <div className="tab-navigation">
      {/* デスクトップ用サイドナビ */}
      <nav className="desktop-nav">
        <div className="nav-header">
          <h3>⚽ 宮中サッカー部</h3>
        </div>
        <ul className="nav-menu">
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* モバイル用トップナビ */}
      <nav className="mobile-nav-top">
        <div className="mobile-nav-scroll">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="tab-content">
        <div className="content-wrapper">
          {renderTabContent()}
        </div>
      </main>

      {/* モバイル用ボトムナビ */}
      <nav className="mobile-nav-bottom">
        {tabs.slice(0, 4).map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
        <button
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">設定</span>
        </button>
      </nav>
    </div>
  );
};

// タブコンテンツ用のラッパーコンポーネント
export const TabContent = ({ tabId, children }) => {
  return <div data-tab={tabId}>{children}</div>;
};

export default TabNavigation;