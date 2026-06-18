'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Command, Search, BarChart2, Radar, Target, Flame, Zap, Eye, ArrowRight } from 'lucide-react'

interface Suggestion {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  module: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'market',
    label: 'Market Depth',
    description: 'Live prices & sparklines for BTC, ETH, SOL...',
    icon: <BarChart2 className="w-4 h-4 text-cyan-400" />,
    keywords: ['market','price','btc','eth','sol','coins','ticker','depth','bitcoin','ethereum','solana'],
    module: 'market',
  },
  {
    id: 'whales',
    label: 'Whale Radar',
    description: 'Top 10 holders for ETH, BTC, SOL',
    icon: <Radar className="w-4 h-4 text-violet-400" />,
    keywords: ['whale','holder','wallet','eth whales','btc whales','sol whales','top holders','rich list','biggest'],
    module: 'whales',
  },
  {
    id: 'predictions',
    label: 'Prediction Arena',
    description: 'Crypto prediction market odds',
    icon: <Target className="w-4 h-4 text-amber-400" />,
    keywords: ['prediction','market','bet','odds','forecast','polymarket','100k','ath','defi'],
    module: 'predictions',
  },
  {
    id: 'alpha',
    label: 'Alpha Stream',
    description: 'Social sentiment & trending topics',
    icon: <Flame className="w-4 h-4 text-pink-400" />,
    keywords: ['alpha','sentiment','social','trending','twitter','x','crypto twitter','ct','bullish','fud','signal'],
    module: 'alpha',
  },
  {
    id: 'chain',
    label: 'Chain Pulse',
    description: 'Gas prices & active addresses',
    icon: <Zap className="w-4 h-4 text-emerald-400" />,
    keywords: ['gas','chain','fee','gwei','ethereum gas','active','addresses','network','pulse','congestion'],
    module: 'chain',
  },
  {
    id: 'mempool',
    label: 'Mempool Vision',
    description: 'Large pending transactions > $1M',
    icon: <Eye className="w-4 h-4 text-indigo-400" />,
    keywords: ['mempool','transaction','pending','large','whale tx','transfer','million','swap','liquidation'],
    module: 'mempool',
  },
]

function score(q: string, s: Suggestion): number {
  const words = q.toLowerCase().split(/\s+/)
  let pts = 0
  for (const w of words) {
    if (s.label.toLowerCase().includes(w)) pts += 3
    if (s.keywords.some(k => k.includes(w) || w.includes(k))) pts += 2
    if (s.description.toLowerCase().includes(w)) pts += 1
  }
  return pts
}

interface Props {
  open: boolean
  onClose: () => void
  onSelectModule: (module: string) => void
}

export default function CommandPalette({ open, onClose, onSelectModule }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.trim()
    ? SUGGESTIONS.filter(s => score(query, s) > 0)
        .sort((a, b) => score(query, b) - score(query, a))
    : SUGGESTIONS

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[selected]
        if (item) { onSelectModule(item.module); onClose() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, selected, onSelectModule, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
          >
            <div className="glass rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(34,211,238,0.15), 0 25px 50px rgba(0,0,0,0.6)' }}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='Try "show me ETH whales" or "gas fees"…'
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none font-mono"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-[10px] font-data text-slate-600 hover:text-slate-400 transition-colors">
                    Clear
                  </button>
                )}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 text-[10px] font-data text-slate-600 border border-slate-700/40">ESC</kbd>
              </div>

              {/* Results */}
              <div className="py-1.5 max-h-64 overflow-y-auto">
                {results.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-600">No modules matched.</div>
                )}
                {results.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { onSelectModule(s.module); onClose() }}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                      selected === i ? 'bg-slate-700/40' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 font-medium">{s.label}</div>
                      <div className="text-xs text-slate-500 truncate">{s.description}</div>
                    </div>
                    {selected === i && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/30 bg-slate-900/30">
                <div className="flex items-center gap-3 text-[10px] font-data text-slate-600">
                  <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded border border-slate-700">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded border border-slate-700">↵</kbd> open</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                  <Command className="w-3 h-3" />
                  <span className="font-data">Insights Terminal</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
