import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppWithSupabase from './AppWithSupabase.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithSupabase />
  </StrictMode>,
)
