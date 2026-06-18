'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Flame, Hash, FlaskConical } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { sampleAlphaStream } from '@/lib/sampleData'

export default function AlphaStream() {
  const { isDemoMode, addCredits } = useStore()
  const [data, setData] = useState(sampleAlphaStream)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 550))
        setData({
          ...sampleAlphaStream,
          trending: sampleAlphaStream.trending
            .slice()
            .sort(() => Math.random() - 0.5)
            .map(t => ({ ...t, mentions: Math.round(t.mentions * (0.9 + Math.random() * 0.2)) })),
        })
      } else {
        // No surf social API — use simulated refresh
        await new Promise(r => setTimeout(r, 400))
        setData({
          ...sampleAlphaStream,
          trending: sampleAlphaStream.trending
            .slice()
            .sort(() => Math.random() - 0.5),
        })
      }
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  const sentimentColor = (s: string) =>
    s === 'positive' ? 'text-emerald-400 hover:text-emerald-300' :
    s === 'negative' ? 'text-red-400 hover:text-red-300' :
    'text-slate-400 hover:text-slate-300'

  const sentimentBg = (s: string) =>
    s === 'positive' ? 'bg-emerald-500/8' :
    s === 'negative' ? 'bg-red-500/8' :
    'bg-slate-500/8'

  const maxWeight = Math.max(...data.wordCloud.map(w => w.weight))

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full" style={{ boxShadow: '0 0 24px rgba(244, 114, 182, 0.08), 0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-pink-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">ALPHA STREAM</h2>
          <span className="flex items-center gap-1 text-[10px] font-data text-amber-500 bg-amber-500/8 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
            <FlaskConical className="w-2.5 h-2.5" />SIM
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-pink-400 hover:bg-slate-800/60 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        {/* Word Cloud */}
        <div className="p-4 border-b border-slate-700/20">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3 font-data">Sentiment Cloud</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {data.wordCloud.map((w, i) => {
              const scale = w.weight / maxWeight
              const size = 10 + Math.round(scale * 14)
              return (
                <span
                  key={i}
                  className={`cursor-default transition-all duration-200 font-semibold rounded px-1 py-0.5 ${sentimentColor(w.sentiment)} ${sentimentBg(w.sentiment)}`}
                  style={{ fontSize: `${size}px`, opacity: 0.5 + scale * 0.5 }}
                  title={`${w.word} — ${w.sentiment} (${w.weight})`}
                >
                  {w.word}
                </span>
              )
            })}
          </div>
        </div>

        {/* Trending */}
        <div className="flex-1 p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3 font-data">Trending Now</p>
          <div className="space-y-2">
            {data.trending.map((t, i) => {
              const isPositive = t.sentiment >= 0.6
              const isNegative = t.sentiment < 0.4
              const sentColor = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-amber-400'
              const changeColor = t.change > 0 ? 'text-emerald-400' : 'text-red-400'

              return (
                <div key={i} className="flex items-center gap-3 group">
                  <span className="text-[10px] font-data text-slate-600 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-slate-300 truncate">{t.topic.replace('#', '')}</span>
                    </div>
                    {/* Sentiment bar */}
                    <div className="mt-1 h-1 bg-slate-800/60 rounded-full overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-400/60' : isNegative ? 'bg-red-400/60' : 'bg-amber-400/60'}`}
                        style={{ width: `${t.sentiment * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-data text-slate-400">{(t.mentions / 1000).toFixed(1)}K</div>
                    <div className={`text-[10px] font-data ${changeColor}`}>
                      {t.change > 0 ? '+' : ''}{t.change}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
