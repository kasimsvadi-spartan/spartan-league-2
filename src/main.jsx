import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import App from './App.jsx'

// A deploy can leave an already-open tab holding an old bundle that references chunk
// files the new deploy no longer serves (404 on lazy-load). Both listeners force a
// one-time reload to pick up the fresh bundle instead of leaving the tab stuck.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('reloaded-after-preload-error')) return
  sessionStorage.setItem('reloaded-after-preload-error', '1')
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
