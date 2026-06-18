'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import CommandPalette from '@/components/CommandPalette'
import MarketDepth from '@/components/modules/MarketDepth'
import WhaleRadar from '@/components/modules/WhaleRadar'
import PredictionArena from '@/components/modules/PredictionArena'
import AlphaStream from '@/components/modules/AlphaStream'
import ChainPulse from '@/components/modules/ChainPulse'
import MempoolVision from '@/components/modules/MempoolVision'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const cardAnim = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show:   { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const MODULE_IDS = ['market', 'whales', 'predictions', 'alpha', 'chain', 'mempool'] as const
type ModuleId = typeof MODULE_IDS[number]

export default function Dashboard() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const moduleRefs = useRef<Record<ModuleId, HTMLDivElement | null>>({
    market: null, whales: null, predictions: null,
    alpha: null, chain: null, mempool: null,
  })

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleSelectModule(module: string) {
    const el = moduleRefs.current[module as ModuleId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('ring-2', 'ring-cyan-400/40', 'ring-offset-2', 'ring-offset-slate-950')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-cyan-400/40', 'ring-offset-2', 'ring-offset-slate-950')
      }, 2000)
    }
  }

  function setRef(id: ModuleId) {
    return (el: HTMLDivElement | null) => { moduleRefs.current[id] = el }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Ambient background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] bg-violet-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-emerald-900/8 rounded-full blur-[100px]" />
      </div>

      <Header onOpenPalette={() => setPaletteOpen(true)} />

      <main className="relative z-10 max-w-[1920px] mx-auto px-4 py-6 space-y-4">
        {/* Market Depth — full width */}
        <motion.div
          ref={setRef('market')}
          variants={cardAnim}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <MarketDepth />
        </motion.div>

        {/* Row 2: Whale Radar | Prediction Arena | Alpha Stream */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          style={{ minHeight: 400 }}
        >
          <motion.div ref={setRef('whales')} variants={cardAnim} className="lg:col-span-1 flex flex-col" style={{ minHeight: 400 }}>
            <WhaleRadar />
          </motion.div>
          <motion.div ref={setRef('predictions')} variants={cardAnim} className="lg:col-span-1 flex flex-col" style={{ minHeight: 400 }}>
            <PredictionArena />
          </motion.div>
          <motion.div ref={setRef('alpha')} variants={cardAnim} className="lg:col-span-1 flex flex-col" style={{ minHeight: 400 }}>
            <AlphaStream />
          </motion.div>
        </motion.div>

        {/* Row 3: Chain Pulse | Mempool Vision */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{ minHeight: 380 }}
        >
          <motion.div ref={setRef('chain')} variants={cardAnim} className="flex flex-col" style={{ minHeight: 380 }}>
            <ChainPulse />
          </motion.div>
          <motion.div ref={setRef('mempool')} variants={cardAnim} className="flex flex-col" style={{ minHeight: 380 }}>
            <MempoolVision />
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex items-center justify-between py-4 border-t border-slate-800/50 text-[11px] font-data text-slate-700"
        >
          <span>INSIGHTS TERMINAL v1.0.0 · Built on Surf</span>
          <span>Data may be delayed · Not financial advice</span>
        </motion.footer>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectModule={handleSelectModule}
      />
    </div>
  )
}
