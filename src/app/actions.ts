'use server'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Module-level session credit counter (persists across calls in same process)
let _sessionCredits = 0

async function surf(args: string): Promise<Record<string, unknown>> {
  const { stdout } = await execAsync(`surf ${args} --json --quiet`, { timeout: 20000 })
  return JSON.parse(stdout) as Record<string, unknown>
}

function fmtVol(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toFixed(0)}`
}

function timeAgo(unix: number): string {
  const s = Math.floor(Date.now() / 1000) - unix
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// ─── Market Depth ─────────────────────────────────────────────────────────────

const MARKET_PAIRS = [
  { symbol: 'BTC',  pair: 'BTC/USDT'  },
  { symbol: 'ETH',  pair: 'ETH/USDT'  },
  { symbol: 'SOL',  pair: 'SOL/USDT'  },
  { symbol: 'AAVE', pair: 'AAVE/USDT' },
  { symbol: 'LINK', pair: 'LINK/USDT' },
  { symbol: 'UNI',  pair: 'UNI/USDT'  },
  { symbol: 'ARB',  pair: 'ARB/USDT'  },
  { symbol: 'OP',   pair: 'OP/USDT'   },
]

export async function getMarketDepth() {
  try {
    const results = await Promise.all(
      MARKET_PAIRS.map(async ({ symbol, pair }) => {
        const [priceRes, klineRes] = await Promise.all([
          surf(`exchange-price --pair ${pair} --exchange binance`),
          surf(`exchange-klines --pair ${pair} --exchange binance --interval 1h --limit 8`),
        ])
        const pd = (priceRes.data as Record<string, number>[])[0]
        const kd = (klineRes.data as { candles: { close: number }[] }).candles
        const credits = (priceRes.meta as { credits_used: number }).credits_used +
                        (klineRes.meta as { credits_used: number }).credits_used
        _sessionCredits += credits
        return {
          symbol,
          price: pd.last ?? 0,
          change24h: pd.change_24h_pct ?? 0,
          volume: fmtVol((pd.volume_24h_base ?? 0) * (pd.last ?? 0)),
          sparkline: kd?.map((c) => c.close) ?? [],
        }
      })
    )
    return { success: true, data: { prices: results } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Whale Radar ──────────────────────────────────────────────────────────────

const TOKEN_CONTRACTS: Record<string, { address: string; chain: string }> = {
  AAVE: { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', chain: 'ethereum' },
  ETH:  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' }, // WETH
  BTC:  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chain: 'ethereum' }, // WBTC
  SOL:  { address: 'So11111111111111111111111111111111111111112', chain: 'solana'   }, // wSOL
}

export async function getWhaleIntel(token: string) {
  const contract = TOKEN_CONTRACTS[token]
  if (!contract) return { success: false, error: `Unknown token: ${token}` }
  try {
    const res = await surf(
      `token-holders --address ${contract.address} --chain ${contract.chain} --include labels --limit 10`
    )
    _sessionCredits += (res.meta as { credits_used: number }).credits_used ?? 1
    const holders = (res.data as Array<{
      address: string
      balance: string
      entity_name?: string
      percentage: number
      label?: { labels?: Array<{ label: string }> }
    }>).map((h) => ({
      address: h.address.slice(0, 6) + '...' + h.address.slice(-4),
      name: h.label?.labels?.[0]?.label ?? h.entity_name ?? 'Unknown Wallet',
      percentage: parseFloat(h.percentage.toFixed(2)),
    }))
    return { success: true, data: { holders } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Prediction Markets ───────────────────────────────────────────────────────

function fmtExpiry(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export async function getPredictionMarkets() {
  try {
    const res = await surf(`kalshi-markets --limit 15`)
    _sessionCredits += (res.meta as { credits_used: number }).credits_used ?? 1
    const raw = res.data as Array<{
      title: string
      category?: string
      subcategory?: string
      total_volume: number
      notional_volume_usd: number
      open_interest: number
      close_time: number
      status: string
    }>
    const markets = raw
      .filter((m) => m.status === 'active')
      .slice(0, 7)
      .map((m) => {
        const yes = Math.min(95, Math.max(5, Math.round(
          m.total_volume > 0 ? (m.notional_volume_usd / m.total_volume) * 100 : 50
        )))
        return {
          question: m.title,
          category: m.subcategory ?? m.category ?? 'Market',
          yes,
          no: 100 - yes,
          volume: fmtVol(m.notional_volume_usd),
          expires: fmtExpiry(m.close_time),
        }
      })
    return { success: true, data: { markets } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Social Trends (simulated — no surf API) ──────────────────────────────────

export async function getSocialTrends() {
  // Surf has no social-trending command; return variant of demo data
  return {
    success: true,
    data: {
      sentiment: {
        score: Math.round(65 + Math.random() * 20),
        label: 'BULLISH',
        keywords: [
          { word: 'breakout',      count: 22000 + Math.round(Math.random() * 5000), sentiment: 'positive' as const },
          { word: 'accumulate',    count: 18000, sentiment: 'positive' as const },
          { word: 'bullish',       count: 16000, sentiment: 'positive' as const },
          { word: 'altseason',     count: 13000, sentiment: 'positive' as const },
          { word: 'correction',    count: 11000, sentiment: 'negative' as const },
          { word: 'institutional', count: 9000,  sentiment: 'positive' as const },
          { word: 'liquidation',   count: 7500,  sentiment: 'negative' as const },
          { word: 'ETF flows',     count: 6800,  sentiment: 'positive' as const },
          { word: 'resistance',    count: 6200,  sentiment: 'negative' as const },
          { word: 'degen',         count: 5400,  sentiment: 'neutral'  as const },
          { word: 'support',       count: 4800,  sentiment: 'positive' as const },
          { word: 'rekt',          count: 4200,  sentiment: 'negative' as const },
          { word: 'moon',          count: 3600,  sentiment: 'positive' as const },
          { word: 'FUD',           count: 3200,  sentiment: 'negative' as const },
          { word: 'LFG',           count: 2800,  sentiment: 'positive' as const },
        ],
      },
      trending: [
        { topic: 'ETH breakout',     mentions: 24800, change: 142 },
        { topic: 'BTC dominance',    mentions: 19200, change: 38  },
        { topic: 'SOL ecosystem',    mentions: 14600, change: 215 },
        { topic: 'DeFi summer v2',   mentions: 11400, change: 89  },
        { topic: 'AAVE proposal v4', mentions: 8700,  change: 57  },
        { topic: 'ARB token burn',   mentions: 6400,  change: -12 },
        { topic: 'Fed rate cut',     mentions: 5900,  change: -24 },
      ],
    },
  }
}

// ─── On-Chain Metrics (simulated — no surf gas API) ───────────────────────────

export async function getOnChainMetrics(_chain: string) {
  const base = [12,14,11,9,8,10,14,20,26,32,38,35,28,24,20,18,22,28,34,38,32,24,18,14]
  return {
    success: true,
    data: {
      network: 'ETHEREUM',
      gas: {
        current: Math.round(15 + Math.random() * 10),
        average: Math.round(20 + Math.random() * 8),
        high: Math.round(40 + Math.random() * 15),
        history: base.map(v => Math.round(v * (0.85 + Math.random() * 0.3))),
      },
      activeAddresses: {
        current: Math.round(460000 + Math.random() * 50000),
        change: parseFloat((Math.random() * 6 - 2).toFixed(1)),
      },
      tps: {
        current: parseFloat((12 + Math.random() * 6).toFixed(1)),
        peak: parseFloat((18 + Math.random() * 4).toFixed(1)),
      },
    },
  }
}

// ─── Mempool Alerts (large USDC / USDT / WETH transfers) ─────────────────────

type TxType = 'transfer' | 'exchange' | 'institutional' | 'defi'

function classifyType(entityType?: string): TxType {
  if (!entityType) return 'transfer'
  if (entityType === 'exchange') return 'exchange'
  if (['fund', 'custodian', 'institution'].includes(entityType)) return 'institutional'
  if (['cdp', 'defi', 'amm', 'misc'].includes(entityType)) return 'defi'
  return 'transfer'
}

type RawTx = {
  tx_hash: string
  from_address: string
  to_address: string
  amount: string
  symbol: string
  timestamp: number
  from_label?: { entity_name?: string; entity_type?: string; labels?: Array<{ label: string }> }
  to_label?:   { entity_name?: string; entity_type?: string; labels?: Array<{ label: string }> }
}

function labelOf(l?: RawTx['from_label'], addr?: string): string {
  if (l?.labels?.[0]?.label) return l.labels[0].label
  if (l?.entity_name) return l.entity_name
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : 'Unknown'
}

const MEMPOOL_TOKENS = [
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum' }, // USDC
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chain: 'ethereum' }, // USDT
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' }, // WETH
]

const ETH_PRICE_APPROX = 1800 // rough USD/ETH for value filter

export async function getMempoolAlerts(minValue: string) {
  const threshold = parseFloat(minValue)
  try {
    const settled = await Promise.allSettled(
      MEMPOOL_TOKENS.map(({ address, chain }) =>
        surf(`token-transfers --address ${address} --chain ${chain} --include labels --limit 30`)
      )
    )
    const alerts: {
      txHash: string; amount: number; token: string
      from: string; to: string; time: string; type: TxType
    }[] = []

    for (const r of settled) {
      if (r.status !== 'fulfilled') continue
      _sessionCredits += (r.value.meta as { credits_used: number }).credits_used ?? 1
      for (const tx of r.value.data as RawTx[]) {
        const raw = parseFloat(tx.amount)
        const usd = tx.symbol === 'WETH' ? raw * ETH_PRICE_APPROX : raw
        if (usd < threshold) continue
        alerts.push({
          txHash: tx.tx_hash.slice(0, 6) + '...' + tx.tx_hash.slice(-4),
          amount: parseFloat(raw.toFixed(tx.symbol === 'WETH' ? 3 : 0)),
          token: tx.symbol,
          from: labelOf(tx.from_label, tx.from_address),
          to:   labelOf(tx.to_label,   tx.to_address),
          time: timeAgo(tx.timestamp),
          type: classifyType(tx.to_label?.entity_type),
        })
      }
    }
    alerts.sort((a, b) => {
      const aUsd = a.token === 'WETH' ? a.amount * ETH_PRICE_APPROX : a.amount
      const bUsd = b.token === 'WETH' ? b.amount * ETH_PRICE_APPROX : b.amount
      return bUsd - aUsd
    })
    return { success: true, data: { alerts: alerts.slice(0, 12) } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function getCreditsUsed(): Promise<number> {
  return _sessionCredits
}
