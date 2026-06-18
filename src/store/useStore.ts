'use client'
import { create } from 'zustand'

interface TerminalStore {
  isDemoMode: boolean
  credits: number
  activeModule: string | null
  toggleDemoMode: () => void
  addCredits: (n: number) => void
  setActiveModule: (module: string | null) => void
}

export const useStore = create<TerminalStore>()((set) => ({
  isDemoMode: true,
  credits: 0,
  activeModule: null,
  toggleDemoMode: () => set((s) => ({ isDemoMode: !s.isDemoMode })),
  addCredits: (n) => set((s) => ({ credits: s.credits + n })),
  setActiveModule: (module) => set({ activeModule: module }),
}))
