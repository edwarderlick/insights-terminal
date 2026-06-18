'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Activity, Command, Cpu, Zap } from 'lucide-react'

interface HeaderProps {
  onOpenPalette: () => void
}

export default function Header({ onOpenPalette }: HeaderProps) {
  const { isDemoMode, credits, toggleDemoMode } = useStore()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-700/30">
      <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 live-dot border border-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight gradient-text-cyan">
              INSIGHTS TERMINAL
            </h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Built on Surf</p>
          </div>
        </div>

        {/* Center — system status */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-cyan-500" />
            <span className="font-data">6 MODULES ACTIVE</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="font-data">LATENCY 42MS</span>
          </span>
          <div className="h-3 w-px bg-slate-700" />
          <span className="text-slate-600 font-data" suppressHydrationWarning>
            {clock} UTC
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Credits */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-data text-slate-300">
              <span className="text-cyan-400 font-semibold">{credits}</span>
              <span className="text-slate-500 ml-1">credits used</span>
            </span>
          </div>

          {/* Demo Mode toggle */}
          <button
            onClick={toggleDemoMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 ${
              isDemoMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 live-dot'}`} />
            {isDemoMode ? 'DEMO' : 'LIVE'}
          </button>

          {/* Command palette trigger */}
          <button
            onClick={onOpenPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass glass-hover border border-slate-700/40 text-xs text-slate-400 hover:text-slate-200 transition-all duration-200"
          >
            <Command className="w-3 h-3" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-700/60 text-[10px] text-slate-500 font-data">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
