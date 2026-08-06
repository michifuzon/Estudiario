import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'
import { QuickCaptureSheet } from '@/features/capture/QuickCaptureSheet'
import { WelcomeToast } from '@/components/WelcomeToast'

export function AppShell() {
  return (
    <div className="flex h-svh overflow-hidden bg-paper">
      <Sidebar />
      {/* [contain:layout] convierte esta columna en el "viewport" de cualquier
          position:fixed que haya adentro (como la barra de escribir del
          chat) — así queda anclada al ancho de esta columna, sin meterse
          debajo del sidebar en desktop. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden [contain:layout]">
        <MobileTopBar />
        <main className="mx-auto w-full flex-1 overflow-y-auto pb-24 sm:pb-8">
          <Outlet />
        </main>
        <WelcomeToast />
      </div>
      <BottomNav />
      <QuickCaptureSheet />
    </div>
  )
}
