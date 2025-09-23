import React, { useState, useEffect } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // 自動削除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    warning: (message, duration) => showToast(message, 'warning', duration)
  };
}

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // アニメーション用の遅延
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getTypeStyles = () => {
    const baseStyles = {
      backgroundColor: '#fff',
      border: '1px solid',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      minWidth: '300px',
      transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative'
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          borderColor: '#10b981',
          backgroundColor: '#f0fdf4'
        };
      case 'error':
        return {
          ...baseStyles,
          borderColor: '#ef4444',
          backgroundColor: '#fef2f2'
        };
      case 'warning':
        return {
          ...baseStyles,
          borderColor: '#f59e0b',
          backgroundColor: '#fffbeb'
        };
      default:
        return {
          ...baseStyles,
          borderColor: '#6b7280',
          backgroundColor: '#f9fafb'
        };
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      style={getTypeStyles()}
      onClick={handleRemove}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        <span style={{
          flex: 1,
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#374151'
        }}>
          {toast.message}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#6b7280',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}