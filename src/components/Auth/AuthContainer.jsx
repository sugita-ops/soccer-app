import { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import QuickLogin from './QuickLogin'

export default function AuthContainer() {
  const [mode, setMode] = useState('quick') // 'quick', 'login', 'signup'

  return (
    <div className="login-container">
      {mode === 'quick' && (
        <QuickLogin onToggle={() => setMode('login')} />
      )}

      {mode === 'login' && (
        <LoginForm
          onSwitchToSignup={() => setMode('signup')}
          onSwitchToQuick={() => setMode('quick')}
        />
      )}

      {mode === 'signup' && (
        <SignupForm
          onSwitchToLogin={() => setMode('login')}
          onSwitchToQuick={() => setMode('quick')}
        />
      )}
    </div>
  )
}