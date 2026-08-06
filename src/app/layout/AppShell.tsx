import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'
import { QuickCaptureSheet } from '@/features/capture/QuickCaptureSheet'

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-paper">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="mx-auto w-full flex-1 pb-24 sm:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <QuickCaptureSheet />
    </div>
  )
}
