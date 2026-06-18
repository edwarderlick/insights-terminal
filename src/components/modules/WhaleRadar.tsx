'use client'

import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw, Radar } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { sampleWhaleRadar } from '@/lib/sampleData'
import { fetchWhaleRadarAction } from '@/app/actions'

const TOKENS = ['ETH', 'BTC', 'SOL']
const PIE_COLORS = ['#22d3ee','#818cf8','#34d399','#fb923c','#f472b6','#a78bfa','#60a5fa','#4ade80','#fbbf24','#f87171']

export default function WhaleRadar() {
  const { isDemoMode, addCredits } = useStore()
  const [token, setToken] = useState('ETH')
  const [data, setData] = useState(sampleWhaleRadar['ETH'])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const loadToken = useCallback(async (t: string) => {
    setToken(t)
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 400))
        setData(sampleWhaleRadar[t] ?? sampleWhaleRadar['ETH'])
      } else {
        const live = await fetchWhaleRadarAction(t) as typeof data
        setData(live)
        addCredits(1)
      }
    } catch {
      setData(sampleWhaleRadar[t] ?? sampleWhaleRadar['ETH'])
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  const pieData = data.topHolders.map(h => ({ name: h.label, value: h.percentage }))

  return (
    <div className="glass rounded-xl glow-violet overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">WHALE RADAR</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700/40">
            {TOKENS.map(t => (
              <button
                key={t}
                onClick={() => loadToken(t)}
                className={`px-2.5 py-1 text-xs font-data font-semibold transition-all duration-200 ${
                  token === t
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadToken(token)}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-800/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-0 flex-1 min-h-0">
        {/* Pie chart */}
        <div className="w-full sm:w-48 h-44 sm:h-auto flex-shrink-0 flex items-center justify-center p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="82%"
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, idx) => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                isAnimationActive
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.35}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Holders list */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {data.topHolders.map((h, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              className={`flex items-center gap-3 px-3 py-1.5 transition-colors duration-150 ${activeIdx === i ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 truncate">{h.label}</div>
                <div className="text-[10px] font-data text-slate-600">{h.address}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-data font-semibold text-slate-200">{h.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
