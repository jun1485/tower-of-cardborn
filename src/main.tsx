import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './styles/global.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'

/** 네이티브 앱 기존 서비스 워커·캐시 정리 */
function unregisterNativeServiceWorker(): void {
  void navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => caches.keys())
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('tower-of-cardborn-')).map((key) => caches.delete(key))))
    .catch(() => undefined)
}

/** 오프라인 실행 서비스 워커 등록 (웹 한정, 네이티브는 앱 번들 자산 사용) */
function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  if (Capacitor.isNativePlatform()) {
    unregisterNativeServiceWorker()
    return
  }
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('오프라인 실행 준비에 실패했습니다.')
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

registerServiceWorker()
