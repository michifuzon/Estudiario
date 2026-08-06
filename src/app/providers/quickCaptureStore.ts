import { create } from 'zustand'

interface QuickCaptureState {
  open: boolean
  openCapture: () => void
  close: () => void
}

export const useQuickCaptureStore = create<QuickCaptureState>((set) => ({
  open: false,
  openCapture: () => set({ open: true }),
  close: () => set({ open: false }),
}))
