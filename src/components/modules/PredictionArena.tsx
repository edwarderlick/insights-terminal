'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { samplePredictions } from '@/lib/sampleData'
import { fetchPredictionsAction } from '@/app/actions'

const CATEGORY_COLORS: Record<string, string> = {
  Price:      'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Flippening: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  DeFi:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Macro:      'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Flows:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Governance: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

function fmtVol(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

export default function PredictionArena() {
  const { isDemoMode, addCredits } = useStore()
  const [data, setData] = useState(samplePredictions)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 500))
        setData({
          markets: samplePredictions.markets.map(m => ({
            ...m,
            yesOdds: Math.max(5, Math.min(95, m.yesOdds + Math.round((Math.random() - 0.5) * 6))),
          }))
        })
      } else {
        const live = await fetchPredictionsAction()
        setData({ markets: live.markets as typeof data.markets })
        addCredits(live.creditsUsed ?? 1)
      }
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full" style={{ boxShadow: '0 0 24px rgba(251, 191, 36, 0.08), 0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">PREDICTION ARENA</h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {data.markets.map((m) => {
          const noOdds = 100 - m.yesOdds
          const catStyle = CATEGORY_COLORS[m.category] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/20'
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus

          return (
            <div key={m.id} className="px-4 py-3 border-b border-slate-700/20 hover:bg-slate-800/20 transition-colors duration-150 group">
              {/* Question */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-slate-200 leading-relaxed flex-1">{m.question}</p>
                <TrendIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${m.trend === 'up' ? 'text-emerald-400' : m.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`} />
              </div>

              {/* Odds bar */}
              <div className="relative h-5 rounded-full overflow-hidden bg-slate-800/60 mb-1.5">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500/70 to-emerald-400/60 flex items-center pl-2 transition-all duration-700"
                  style={{ width: `${m.yesOdds}%` }}
                >
                  {m.yesOdds > 18 && (
                    <span className="text-[10px] font-data font-bold text-emerald-100">YES {m.yesOdds}%</span>
                  )}
                </div>
                <div
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500/70 to-red-400/60 flex items-center justify-end pr-2 transition-all duration-700"
                  style={{ width: `${noOdds}%` }}
                >
                  {noOdds > 18 && (
                    <span className="text-[10px] font-data font-bold text-red-100">NO {noOdds}%</span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${catStyle}`}>{m.category}</span>
                  <span className="text-[10px] font-data text-slate-500">Vol {fmtVol(m.volume)}</span>
                </div>
                <span className="text-[10px] font-data text-slate-600">Exp {m.expiry}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
