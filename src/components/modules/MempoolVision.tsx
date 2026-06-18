'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Eye, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { sampleMempool } from '@/lib/sampleData'
import { fetchMempoolAction } from '@/app/actions'

const TYPE_STYLE: Record<string, string> = {
  Transfer:  'text-cyan-400   bg-cyan-500/10   border-cyan-500/20',
  Swap:      'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Deposit:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Liquidate: 'text-red-400    bg-red-500/10    border-red-500/20',
}

const TOKEN_COLOR: Record<string, string> = {
  USDC: 'text-blue-400', USDT: 'text-green-400', ETH: 'text-violet-300',
  BTC: 'text-amber-400', WBTC: 'text-amber-400', WETH: 'text-violet-300',
  SOL: 'text-purple-400', DAI: 'text-amber-300',
}

function fmtValue(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

export default function MempoolVision() {
  const { isDemoMode, addCredits } = useStore()
  const [data, setData] = useState(sampleMempool)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 500))
        setData({
          transactions: [...sampleMempool.transactions].reverse().map(tx => ({
            ...tx,
            time: `${Math.floor(Math.random() * 10) + 1}s ago`,
            gas: Math.round(tx.gas * (0.85 + Math.random() * 0.3)),
          }))
        })
      } else {
        const live = await fetchMempoolAction() as typeof data
        setData(live)
        addCredits(1)
      }
    } catch {
      // fall back silently
    } finally {
      setLoading(false)
    }
  }, [isDemoMode, addCredits])

  return (
    <div className="glass rounded-xl overflow-hidden flex flex-col h-full" style={{ boxShadow: '0 0 24px rgba(99,102,241,0.1), 0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">MEMPOOL VISION</h2>
          <span className="flex items-center gap-1 text-[10px] font-data text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-data text-slate-500 hidden sm:inline">&gt;$1M only</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 border-b border-slate-700/20 bg-slate-900/30">
        <span className="text-[10px] font-data text-slate-600 uppercase tracking-wider">WALLETS</span>
        <span className="text-[10px] font-data text-slate-600 uppercase tracking-wider text-right">VALUE</span>
        <span className="text-[10px] font-data text-slate-600 uppercase tracking-wider text-right hidden sm:block">GAS</span>
        <span className="text-[10px] font-data text-slate-600 uppercase tracking-wider text-right">TIME</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {data.transactions.map((tx, i) => {
          const typeStyle = TYPE_STYLE[tx.type] ?? 'text-slate-400 bg-slate-700/20 border-slate-600/20'
          const tokenColor = TOKEN_COLOR[tx.token] ?? 'text-slate-400'
          const isPending = tx.status === 'pending'

          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 border-b border-slate-700/10 hover:bg-slate-800/25 transition-colors duration-150 group ${isPending ? 'bg-slate-900/20' : ''}`}
            >
              {/* Wallets column */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium font-data ${typeStyle}`}>{tx.type}</span>
                  {isPending && <span className="w-1 h-1 rounded-full bg-amber-400 ticker-pulse" />}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 min-w-0">
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{tx.fromLabel}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{tx.toLabel}</span>
                </div>
                <div className="text-[9px] font-data text-slate-700 truncate">{tx.hash}</div>
              </div>

              {/* Value */}
              <div className="text-right">
                <div className="text-xs font-data font-bold text-white">{fmtValue(tx.value)}</div>
                <div className={`text-[10px] font-data font-semibold ${tokenColor}`}>{tx.token}</div>
              </div>

              {/* Gas */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-data text-slate-300">{tx.gas}</div>
                <div className="text-[9px] font-data text-slate-600">Gwei</div>
              </div>

              {/* Time */}
              <div className="text-right">
                <div className="text-[10px] font-data text-slate-500">{tx.time}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
