'use client'

import { useState, useCallback } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { sampleMarketDepth } from '@/lib/sampleData'
import { fetchMarketDepthAction } from '@/app/actions'

const COIN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF',
  AAVE: '#B6509E', LINK: '#2A5ADA', UNI: '#FF007A',
  ARB: '#28A0F0', OP: '#FF0420',
}

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toFixed(2)}`
}

function fmtPrice(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (n >= 100)   return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export default function MarketDepth() {
  const { isDemoMode, addCredits } = useStore()
  const [data, setData] = useState(sampleMarketDepth)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 600))
        setData({
          coins: sampleMarketDepth.coins.map(c => ({
            ...c,
            price: c.price * (1 + (Math.random() - 0.5) * 0.005),
            change24h: c.change24h + (Math.random() - 0.5) * 0.3,
          }))
        })
      } else {
        const live = await fetchMarketDepthAction()
        setData({ coins: live.coins as typeof sampleMarketDepth.coins })
        addCredits(live.creditsUsed ?? 1)
      }
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  return (
    <div className="glass rounded-xl glow-cyan overflow-hidden">
      {/* Module header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">MARKET DEPTH</h2>
          <span className="text-[10px] font-data text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">8 PAIRS</span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Coin grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y divide-slate-700/20">
        {data.coins.map((coin) => {
          const isUp = coin.change24h >= 0
          const sparkData = coin.sparkline.map((v, i) => ({ v, i }))
          const color = COIN_COLORS[coin.symbol] ?? '#22d3ee'

          return (
            <div
              key={coin.symbol}
              className="p-3 hover:bg-slate-800/30 transition-colors duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-bold text-slate-200 font-data">{coin.symbol}</span>
                </div>
                <span className={`text-[10px] font-data font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isUp ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>

              <div className="text-sm font-data font-semibold text-white mb-1">
                ${fmtPrice(coin.price)}
              </div>

              {/* Sparkline */}
              <div className="h-8 w-full mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${coin.symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? '#34d399' : '#f87171'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={isUp ? '#34d399' : '#f87171'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={isUp ? '#34d399' : '#f87171'}
                      strokeWidth={1.5}
                      fill={`url(#grad-${coin.symbol})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] font-data text-slate-500">
                Vol {fmt(coin.volume24h)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
