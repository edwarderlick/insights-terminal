'use client'

import { useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { RefreshCw, Zap, FlaskConical } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { sampleChainPulse } from '@/lib/sampleData'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function gasColor(intensity: number) {
  if (intensity < 0.25) return 'rgba(34,211,238,0.25)'
  if (intensity < 0.5)  return 'rgba(52,211,153,0.45)'
  if (intensity < 0.75) return 'rgba(251,191,36,0.6)'
  return 'rgba(239,68,68,0.75)'
}

export default function ChainPulse() {
  const { isDemoMode, addCredits } = useStore()
  const [data, setData] = useState(sampleChainPulse)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 450))
        setData({
          ...sampleChainPulse,
          currentGas: {
            ...sampleChainPulse.currentGas,
            slow:     Math.round(sampleChainPulse.currentGas.slow     * (0.9 + Math.random() * 0.2)),
            standard: Math.round(sampleChainPulse.currentGas.standard * (0.9 + Math.random() * 0.2)),
            fast:     Math.round(sampleChainPulse.currentGas.fast     * (0.9 + Math.random() * 0.2)),
          }
        })
      } else {
        // No surf gas API — use simulated refresh
        await new Promise(r => setTimeout(r, 400))
        setData({
          ...sampleChainPulse,
          currentGas: {
            ...sampleChainPulse.currentGas,
            slow:     Math.round(sampleChainPulse.currentGas.slow     * (0.85 + Math.random() * 0.3)),
            standard: Math.round(sampleChainPulse.currentGas.standard * (0.85 + Math.random() * 0.3)),
            fast:     Math.round(sampleChainPulse.currentGas.fast     * (0.85 + Math.random() * 0.3)),
          }
        })
      }
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  const cellMap: Record<string, number> = {}
  for (const cell of data.gasHeatmap) {
    cellMap[`${cell.day}-${cell.hour}`] = cell.intensity
  }

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full" style={{ boxShadow: '0 0 24px rgba(52,211,153,0.08), 0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">CHAIN PULSE</h2>
          <span className="flex items-center gap-1 text-[10px] font-data text-amber-500 bg-amber-500/8 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
            <FlaskConical className="w-2.5 h-2.5" />SIM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-data">
            <span className="text-slate-500">GAS:</span>
            <span className="text-emerald-400">{data.currentGas.slow} ◆</span>
            <span className="text-amber-400">{data.currentGas.standard} ◆</span>
            <span className="text-red-400">{data.currentGas.fast}</span>
            <span className="text-slate-600">Gwei</span>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Gas Heatmap */}
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 font-data">Gas Price Heatmap (7d × 24h)</p>
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              {/* Hour labels */}
              <div className="flex mb-1 pl-8">
                {[0,3,6,9,12,15,18,21].map(h => (
                  <div key={h} className="text-[8px] font-data text-slate-700" style={{ width: `${(24/8)*100/24}%` }}>
                    {h.toString().padStart(2,'0')}h
                  </div>
                ))}
              </div>
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] font-data text-slate-600 w-7 text-right shrink-0">{day}</span>
                  <div className="flex flex-1 gap-px">
                    {HOURS.map(h => {
                      const intensity = cellMap[`${day}-${h}`] ?? 0
                      return (
                        <div
                          key={h}
                          className="flex-1 h-4 rounded-sm transition-all duration-300"
                          style={{ background: gasColor(intensity) }}
                          title={`${day} ${h}:00 — Intensity: ${(intensity * 100).toFixed(0)}%`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-2 pl-8">
                <span className="text-[9px] font-data text-slate-600">Low</span>
                {[0.1,0.3,0.5,0.7,0.9].map(v => (
                  <div key={v} className="w-4 h-2 rounded-sm" style={{ background: gasColor(v) }} />
                ))}
                <span className="text-[9px] font-data text-slate-600">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Addresses Sparkline */}
        <div className="flex-1 min-h-0">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 font-data">Active Addresses (24h)</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activeAddresses} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradAddr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} width={32} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#34d399' }}
                  formatter={(v) => [`${Number(v).toLocaleString()}`, 'Active Addresses']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  fill="url(#gradAddr)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
