'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, Eye, Globe, MessageCircle, Cpu, Radio,
  Search, ChevronRight, ArrowUpRight, Layers, Shield,
  Flame, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react'
import Header from '@/components/Header'
import {
  getMarketDepth, getWhaleIntel, getPredictionMarkets,
  getSocialTrends, getOnChainMetrics, getMempoolAlerts, getCreditsUsed,
} from '@/app/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketPrice   { symbol: string; price: number; change24h: number; volume: string; sparkline: number[] }
interface WhaleHolder   { address: string; name: string; percentage: number }
interface PredictionMkt { question: string; category: string; yes: number; no: number; volume: string; expires: string }
interface MempoolAlert  { txHash: string; amount: number; token: string; from: string; to: string; time: string; type: 'transfer'|'exchange'|'institutional'|'defi' }
interface SocialData    { sentiment: { score: number; label: string; keywords: { word: string; count: number; sentiment: 'positive'|'negative'|'neutral' }[] }; trending: { topic: string; mentions: number; change: number }[] }
interface ChainData     { network: string; gas: { current: number; average: number; high: number; history: number[] }; activeAddresses: { current: number; change: number }; tps: { current: number; peak: number } }

// ─── Demo Data ────────────────────────────────────────────────────────────────

const demoMarketData = { prices: [
  { symbol:'BTC',  price:98432,   change24h:  2.34, volume:'$28.4B', sparkline:[97200,97800,97500,98100,97900,98200,98150,98432] },
  { symbol:'ETH',  price:3842.10, change24h: -0.87, volume:'$14.2B', sparkline:[3880,3860,3855,3872,3840,3830,3848,3842] },
  { symbol:'SOL',  price:187.42,  change24h:  5.12, volume:'$4.8B',  sparkline:[172,175,178,181,183,185,186,187] },
  { symbol:'AAVE', price:312.80,  change24h:  3.67, volume:'$620M',  sparkline:[290,295,298,302,305,308,310,312] },
  { symbol:'LINK', price:18.94,   change24h:  1.22, volume:'$950M',  sparkline:[18.1,18.3,18.5,18.6,18.7,18.8,18.9,18.94] },
  { symbol:'UNI',  price:11.72,   change24h: -2.14, volume:'$430M',  sparkline:[12.2,12.1,12.0,11.9,11.85,11.8,11.75,11.72] },
  { symbol:'ARB',  price:0.982,   change24h:  4.55, volume:'$380M',  sparkline:[0.91,0.92,0.93,0.945,0.955,0.965,0.975,0.982] },
  { symbol:'OP',   price:2.104,   change24h: -1.08, volume:'$290M',  sparkline:[2.14,2.12,2.10,2.11,2.09,2.10,2.11,2.104] },
] as MarketPrice[] }

const demoWhaleData = { holders: [
  { address:'0xBE0e...3a7F', name:'Beacon Deposit Contract', percentage:28.4 },
  { address:'0x00000...dead', name:'Binance Cold Wallet',    percentage:11.2 },
  { address:'0x47ac...1234', name:'Wrapped ETH Contract',   percentage: 9.8 },
  { address:'0xC8e2...89AB', name:'Kraken Exchange',        percentage: 6.4 },
  { address:'0x3f5C...F1E2', name:'Coinbase Custody',       percentage: 5.1 },
  { address:'0x9876...CDEF', name:'Robinhood Wallet',       percentage: 4.3 },
  { address:'0xAABB...5566', name:'Lido Staking Pool',      percentage: 3.9 },
  { address:'0x1122...3344', name:'OKX Exchange',           percentage: 3.2 },
  { address:'0xDEAD...BEEF', name:'Unknown Whale #1',       percentage: 2.7 },
  { address:'0xCAFE...BABE', name:'Unknown Whale #2',       percentage: 2.1 },
] as WhaleHolder[] }

const demoPredictionData = { markets: [
  { question:'BTC above $100k by Jul 2026?',       category:'Price',      yes:72, no:28, volume:'$4.2M', expires:'Jul 31 \'26' },
  { question:'ETH to flip BTC market cap 2026?',   category:'Flippening', yes:18, no:82, volume:'$2.1M', expires:'Dec 31 \'26' },
  { question:'SOL surpasses ETH TVL in DeFi?',     category:'DeFi',       yes:34, no:66, volume:'$1.8M', expires:'Sep 30 \'26' },
  { question:'Fed cuts rates 0.5% before Q4?',     category:'Macro',      yes:54, no:46, volume:'$6.9M', expires:'Sep 16 \'26' },
  { question:'New BTC ATH before end of 2026?',    category:'Price',      yes:81, no:19, volume:'$8.4M', expires:'Dec 31 \'26' },
  { question:'Ethereum ETF inflow > $1B daily?',   category:'Flows',      yes:45, no:55, volume:'$3.3M', expires:'Aug 15 \'26' },
] as PredictionMkt[] }

const demoSocialData: SocialData = {
  sentiment: {
    score: 74, label: 'BULLISH',
    keywords: [
      { word:'bullish',       count:24800, sentiment:'positive' },
      { word:'accumulate',    count:18200, sentiment:'positive' },
      { word:'breakout',      count:15400, sentiment:'positive' },
      { word:'altseason',     count:13000, sentiment:'positive' },
      { word:'correction',    count:11200, sentiment:'negative' },
      { word:'institutional', count: 9800, sentiment:'positive' },
      { word:'liquidation',   count: 8400, sentiment:'negative' },
      { word:'ETF flows',     count: 7200, sentiment:'positive' },
      { word:'resistance',    count: 6800, sentiment:'negative' },
      { word:'degen',         count: 5400, sentiment:'neutral'  },
      { word:'support',       count: 4800, sentiment:'positive' },
      { word:'rekt',          count: 4200, sentiment:'negative' },
      { word:'moon',          count: 3600, sentiment:'positive' },
      { word:'FUD',           count: 3200, sentiment:'negative' },
      { word:'LFG',           count: 2800, sentiment:'positive' },
    ],
  },
  trending: [
    { topic:'ETH breakout',     mentions:24800, change: 142 },
    { topic:'BTC dominance',    mentions:19200, change:  38 },
    { topic:'SOL ecosystem',    mentions:14600, change: 215 },
    { topic:'DeFi summer v2',   mentions:11400, change:  89 },
    { topic:'AAVE proposal v4', mentions: 8700, change:  57 },
    { topic:'ARB token burn',   mentions: 6400, change: -12 },
    { topic:'Fed rate cut',     mentions: 5900, change: -24 },
  ],
}

const demoChainData: ChainData = {
  network: 'ETHEREUM',
  gas: {
    current: 18, average: 22, high: 45,
    history: [12,14,11,9,8,10,14,20,26,32,38,35,28,24,20,18,22,28,34,38,32,24,18,14],
  },
  activeAddresses: { current: 482000, change: 3.2 },
  tps: { current: 14.2, peak: 18.7 },
}

const demoMempoolData = { alerts: [
  { txHash:'0xf8a1...3d72', amount:18400000, token:'USDC', from:'Whale #Delta',   to:'Binance Hot',   time:'2s ago',  type:'transfer'     as const },
  { txHash:'0x2c8b...a11e', amount:    4.32, token:'WETH', from:'Cumberland DRW', to:'Uniswap v4',    time:'5s ago',  type:'exchange'     as const },
  { txHash:'0x9f3d...55ab', amount: 5200000, token:'USDT', from:'Jump Crypto',    to:'Aave v3 Pool',  time:'11s ago', type:'defi'         as const },
  { txHash:'0x7721...c4ff', amount: 4100000, token:'USDC', from:'Unknown Whale',  to:'Coinbase Prime',time:'18s ago', type:'institutional' as const },
  { txHash:'0xedc2...8890', amount: 3750000, token:'USDT', from:'Alameda Estate', to:'Kraken',        time:'31s ago', type:'exchange'     as const },
  { txHash:'0x4482...1fda', amount: 3200000, token:'USDC', from:'Three Arrows',   to:'Maker DAO',     time:'44s ago', type:'defi'         as const },
  { txHash:'0xbc39...7722', amount: 2900000, token:'USDC', from:'Celsius Wallet', to:'OKX Exchange',  time:'1m ago',  type:'exchange'     as const },
  { txHash:'0x5544...3311', amount:    1.95, token:'WETH', from:'Jane Street',    to:'Uniswap v4',    time:'1m ago',  type:'exchange'     as const },
] as MempoolAlert[] }

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data?.length || data.length < 2) return <div className="h-8 w-full" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 100, H = 32, pad = 2
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - pad - ((v - min) / range) * (H - pad * 2)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Module colors ────────────────────────────────────────────────────────────

const WHALE_COLORS = ['#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16']

const TYPE_COLOR: Record<string, string> = {
  transfer:      'text-cyan-400   bg-cyan-500/10',
  exchange:      'text-amber-400  bg-amber-500/10',
  institutional: 'text-violet-400 bg-violet-500/10',
  defi:          'text-pink-400   bg-pink-500/10',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  transfer:      <ArrowUpRight className="h-3 w-3" />,
  exchange:      <Layers       className="h-3 w-3" />,
  institutional: <Shield       className="h-3 w-3" />,
  defi:          <Flame        className="h-3 w-3" />,
}

// ─── Market Depth ─────────────────────────────────────────────────────────────

function MarketDepthModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<MarketPrice[]>(demoMarketData.prices)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('Just now')

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoMarketData.prices); setLastUpdate('Demo mode'); return }
    setLoading(true)
    const res = await getMarketDepth()
    if (res.success && res.data?.prices) {
      setData(res.data.prices as MarketPrice[])
      setLastUpdate(new Date().toLocaleTimeString())
    }
    setLoading(false)
  }, [demoMode])

  useEffect(() => { refresh() }, [refresh])

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
      className="terminal-card gradient-border col-span-2">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Market Depth</h2>
            <span className="text-[10px] text-slate-500 data-mono">8 PAIRS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600 data-mono">{lastUpdate}</span>
            <button onClick={refresh} disabled={loading}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {data.map((coin, i) => (
            <motion.div key={coin.symbol}
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i * 0.05 }}
              className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">{coin.symbol}</span>
                <span className={`text-[10px] data-mono flex items-center gap-0.5 ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-lg font-bold data-mono text-slate-100 mb-1">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price < 10 ? 3 : 2, maximumFractionDigits: coin.price < 10 ? 3 : 2 })}
              </div>
              <div className="text-[10px] text-slate-500 data-mono mb-2">Vol: {coin.volume}</div>
              <Sparkline data={coin.sparkline} color={coin.change24h >= 0 ? '#10b981' : '#ef4444'} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Whale Radar ──────────────────────────────────────────────────────────────

function WhaleRadarModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<WhaleHolder[]>(demoWhaleData.holders)
  const [token, setToken] = useState('AAVE')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoWhaleData.holders); return }
    setLoading(true)
    const res = await getWhaleIntel(token)
    if (res.success && res.data?.holders) setData(res.data.holders as WhaleHolder[])
    setLoading(false)
  }, [demoMode, token])

  useEffect(() => { refresh() }, [refresh])

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="terminal-card gradient-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-200">Whale Radar</h2>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {['AAVE','ETH','BTC','SOL'].map((t) => (
            <button key={t} onClick={() => setToken(t)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                token === t
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:text-slate-300'
              }`}>{t}</button>
          ))}
        </div>

        <div className="space-y-2.5">
          {data.map((h, i) => (
            <div key={h.address} className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: WHALE_COLORS[i] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 truncate">{h.name}</span>
                  <span className="text-xs data-mono font-bold text-slate-200 ml-2 shrink-0">{h.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, h.percentage * 3)}%` }}
                    transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: WHALE_COLORS[i] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Prediction Arena ─────────────────────────────────────────────────────────

function PredictionArenaModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<PredictionMkt[]>(demoPredictionData.markets)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoPredictionData.markets); return }
    setLoading(true)
    const res = await getPredictionMarkets()
    if (res.success && res.data?.markets) setData(res.data.markets as PredictionMkt[])
    setLoading(false)
  }, [demoMode])

  useEffect(() => { refresh() }, [refresh])

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="terminal-card gradient-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Prediction Arena</h2>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3">
          {data.map((market, i) => (
            <motion.div key={i}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.08 }}
              className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs text-slate-300 leading-relaxed">{market.question}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400 shrink-0">{market.category}</span>
              </div>

              <div className="relative h-6 rounded-full overflow-hidden bg-slate-800 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${market.yes}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.9, ease: 'easeOut' }}
                  className="absolute left-0 top-0 h-full bg-emerald-500/80"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${market.no}%` }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.9, ease: 'easeOut' }}
                  className="absolute right-0 top-0 h-full bg-rose-500/80"
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 z-10">
                  <span className="text-[10px] font-bold text-white data-mono">YES {market.yes}%</span>
                  <span className="text-[10px] font-bold text-white data-mono">NO {market.no}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 data-mono">
                <span>Vol: {market.volume}</span>
                <span>Exp: {market.expires}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Alpha Stream ─────────────────────────────────────────────────────────────

function AlphaStreamModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<SocialData>(demoSocialData)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoSocialData); return }
    setLoading(true)
    const res = await getSocialTrends()
    if (res.success && res.data) setData(res.data as SocialData)
    setLoading(false)
  }, [demoMode])

  useEffect(() => { refresh() }, [refresh])

  const sc = data.sentiment.score
  const sentColor = sc > 60 ? 'text-emerald-400' : sc > 40 ? 'text-amber-400' : 'text-rose-400'
  const sentBg    = sc > 60 ? 'bg-emerald-500/10' : sc > 40 ? 'bg-amber-500/10' : 'bg-rose-500/10'

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
      className="terminal-card gradient-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-pink-400" />
            <h2 className="text-sm font-semibold text-slate-200">Alpha Stream</h2>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Sentiment Score */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${sentBg} border border-slate-700/50 mb-4`}>
          <div className={`text-2xl font-bold data-mono ${sentColor}`}>{data.sentiment.score}</div>
          <div>
            <div className={`text-xs font-bold ${sentColor}`}>{data.sentiment.label}</div>
            <div className="text-[10px] text-slate-500">Social Sentiment Index</div>
          </div>
        </div>

        {/* Word Cloud */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Sentiment Cloud</p>
          <div className="flex flex-wrap gap-1.5">
            {data.sentiment.keywords.slice(0, 15).map((kw, i) => (
              <motion.span key={kw.word}
                initial={{ opacity:0, scale:0 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i * 0.03 }}
                className={`px-2 py-1 rounded-md font-medium ${
                  kw.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  kw.sentiment === 'negative' ? 'bg-rose-500/10    text-rose-400    border border-rose-500/20'    :
                                                'bg-slate-700/50   text-slate-400   border border-slate-600'
                }`}
                style={{ fontSize: `${0.65 + (kw.count / 25000) * 0.5}rem` }}>
                {kw.word}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Trending */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Trending Now</p>
          <div className="space-y-1.5">
            {data.trending.map((t, i) => (
              <div key={t.topic} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 data-mono">#{i + 1}</span>
                  <span className="text-xs text-slate-300">{t.topic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] data-mono text-slate-500">{(t.mentions / 1000).toFixed(1)}K</span>
                  <span className={`text-[10px] data-mono ${t.change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.change > 0 ? '+' : ''}{t.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Chain Pulse ──────────────────────────────────────────────────────────────

function ChainPulseModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<ChainData>(demoChainData)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoChainData); return }
    setLoading(true)
    const res = await getOnChainMetrics('ethereum')
    if (res.success && res.data) setData(res.data as ChainData)
    setLoading(false)
  }, [demoMode])

  useEffect(() => { refresh() }, [refresh])

  const maxGas = Math.max(...data.gas.history)

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
      className="terminal-card gradient-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-200">Chain Pulse</h2>
            <span className="text-[10px] text-slate-500 data-mono uppercase">{data.network}</span>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label:'Gas (Gwei)', main: data.gas.current, sub: `avg ${data.gas.average}  ·  high ${data.gas.high}` },
            { label:'Active Addr', main: `${(data.activeAddresses.current / 1000).toFixed(0)}K`,
              sub: `${data.activeAddresses.change > 0 ? '+' : ''}${data.activeAddresses.change}%`,
              subColor: data.activeAddresses.change > 0 ? 'text-emerald-400' : 'text-rose-400' },
            { label:'TPS', main: data.tps.current, sub: `peak ${data.tps.peak}` },
          ].map(({ label, main, sub, subColor }) => (
            <div key={label} className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
              <div className="text-xl font-bold data-mono text-slate-100">{main}</div>
              <div className={`text-[10px] data-mono mt-1 ${subColor ?? 'text-slate-500'}`}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Gas bar chart */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Gas Heatmap (24h)</p>
          <div className="flex items-end gap-0.5 h-16">
            {data.gas.history.map((g, i) => {
              const pct = g / maxGas
              return (
                <motion.div key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${20 + pct * 80}%` }}
                  transition={{ delay: i * 0.03, duration: 0.6, ease: 'easeOut' }}
                  className="flex-1 rounded-sm"
                  style={{
                    backgroundColor: pct > 0.7 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#10b981',
                    opacity: 0.55 + pct * 0.45,
                  }}
                  title={`${i}:00 — ${g} Gwei`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-slate-600 data-mono">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Mempool Vision ───────────────────────────────────────────────────────────

function MempoolVisionModule({ demoMode }: { demoMode: boolean }) {
  const [data, setData] = useState<MempoolAlert[]>(demoMempoolData.alerts)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demoMode) { setData(demoMempoolData.alerts); return }
    setLoading(true)
    const res = await getMempoolAlerts('1000000')
    if (res.success && res.data?.alerts) {
      const alerts = res.data.alerts as MempoolAlert[]
      setData(alerts.length ? alerts : demoMempoolData.alerts)
    }
    setLoading(false)
  }, [demoMode])

  useEffect(() => { refresh() }, [refresh])

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
      className="terminal-card gradient-border col-span-2">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-200">Mempool Vision</h2>
            <span className="text-[10px] text-slate-500 data-mono">&gt;$1M ALERTS</span>
          </div>
          <button onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="text-left pb-2 font-medium">Type</th>
                <th className="text-left pb-2 font-medium">Tx Hash</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-left pb-2 font-medium">Token</th>
                <th className="text-left pb-2 font-medium">From</th>
                <th className="text-left pb-2 font-medium">To</th>
                <th className="text-right pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {data.map((a, i) => (
                <motion.tr key={a.txHash}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.04 }}
                  className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${TYPE_COLOR[a.type] ?? 'text-slate-400 bg-slate-700/50'}`}>
                      {TYPE_ICON[a.type] ?? <AlertTriangle className="h-3 w-3" />}
                      {a.type}
                    </span>
                  </td>
                  <td className="py-2.5 data-mono text-slate-400">{a.txHash}</td>
                  <td className="py-2.5 text-right data-mono font-bold text-slate-200">
                    {a.amount.toLocaleString(undefined, { minimumFractionDigits: a.amount < 1 ? 4 : a.amount < 100 ? 3 : 0, maximumFractionDigits: a.amount < 1 ? 4 : a.amount < 100 ? 3 : 0 })}
                  </td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">{a.token}</span>
                  </td>
                  <td className="py-2.5 data-mono text-slate-500 max-w-[120px] truncate">{a.from}</td>
                  <td className="py-2.5 data-mono text-slate-500 max-w-[120px] truncate">{a.to}</td>
                  <td className="py-2.5 text-right text-slate-500">{a.time}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Command Palette ──────────────────────────────────────────────────────────

const COMMANDS = [
  { id:'market',      label:'Show market prices',      icon:<BarChart3      className="h-4 w-4" /> },
  { id:'whales',      label:'Show ETH whale holders',  icon:<Eye            className="h-4 w-4" /> },
  { id:'predictions', label:'Show prediction markets', icon:<Globe          className="h-4 w-4" /> },
  { id:'sentiment',   label:'Show social sentiment',   icon:<MessageCircle  className="h-4 w-4" /> },
  { id:'gas',         label:'Show gas & chain metrics',icon:<Cpu            className="h-4 w-4" /> },
  { id:'mempool',     label:'Show mempool alerts',     icon:<Radio          className="h-4 w-4" /> },
]

const MODULE_REFS: Record<string, string> = {
  market:'market-section', whales:'whales-section', predictions:'predictions-section',
  sentiment:'alpha-section', gas:'chain-section', mempool:'mempool-section',
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSelect = (id: string) => {
    onClose()
    const el = document.getElementById(MODULE_REFS[id])
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh] bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div
          initial={{ opacity:0, scale:0.95, y:-10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:-10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
            <Search className="h-4 w-4 text-slate-500" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands or modules..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none" />
            <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-800 data-mono">ESC</span>
          </div>
          <div className="p-2">
            {filtered.map((cmd) => (
              <button key={cmd.id} onClick={() => handleSelect(cmd.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left">
                <span className="text-slate-400">{cmd.icon}</span>
                <span className="text-sm text-slate-300">{cmd.label}</span>
                <ChevronRight className="h-3 w-3 text-slate-600 ml-auto" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InsightsTerminal() {
  const [demoMode, setDemoMode] = useState(true)
  const [credits, setCredits] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Poll server-side credit counter every 2 s
  useEffect(() => {
    const update = async () => { setCredits(await getCreditsUsed()) }
    update()
    const id = setInterval(update, 2000)
    return () => clearInterval(id)
  }, [])

  // Cmd+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(p => !p) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-900/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[400px] bg-violet-900/8 rounded-full blur-[140px]" />
      </div>

      <Header credits={credits} demoMode={demoMode} setDemoMode={setDemoMode} onOpenPalette={() => setPaletteOpen(true)} />

      <main className="relative z-10 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-[1400px] mx-auto">
          <div id="market-section"      className="lg:col-span-2"><MarketDepthModule      demoMode={demoMode} /></div>
          <div id="whales-section"      className="lg:col-span-1"><WhaleRadarModule       demoMode={demoMode} /></div>
          <div id="predictions-section" className="lg:col-span-1"><PredictionArenaModule  demoMode={demoMode} /></div>
          <div id="alpha-section"       className="lg:col-span-1"><AlphaStreamModule      demoMode={demoMode} /></div>
          <div id="chain-section"       className="lg:col-span-1"><ChainPulseModule       demoMode={demoMode} /></div>
          <div id="mempool-section"     className="lg:col-span-2"><MempoolVisionModule    demoMode={demoMode} /></div>
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <div className="fixed bottom-4 right-4 text-[10px] text-slate-700 data-mono">
        Insights Terminal v1.0 — Powered by Surf AI
      </div>
    </div>
  )
}
