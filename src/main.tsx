import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Se importan como módulos JS (no @import en CSS) para que Vite resuelva y
// copie los archivos de fuente correctamente en el build de producción —
// via @import anidado en index.css, las url() de @fontsource no se
// empaquetaban bien y la tipografía caía a la fuente del sistema.
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import './index.css'
import App from './App.tsx'

// En desarrollo no registramos service worker (ver vite.config.ts), pero una
// sesión anterior puede haber dejado uno activo cacheando /icons/ de forma
// agresiva. Lo damos de baja para que siempre se vea el estado real.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister())
  })
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
