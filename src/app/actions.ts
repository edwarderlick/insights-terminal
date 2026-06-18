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

// ─── Market Depth — CoinGecko public API (no key, cloud-friendly) ─────────────

const CG_IDS = ['bitcoin','ethereum','solana','aave','chainlink','uniswap','arbitrum','optimism']
const CG_SYMBOL: Record<string, string> = {
  bitcoin:'BTC', ethereum:'ETH', solana:'SOL', aave:'AAVE',
  chainlink:'LINK', uniswap:'UNI', arbitrum:'ARB', optimism:'OP',
}

type CoinGeckoMarket = {
  id: string
  current_price: number
  price_change_percentage_24h: number
  total_volume: number
  sparkline_in_7d: { price: number[] }
}

export async function getMarketDepth() {
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CG_IDS.join(',')}&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=24h`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    )
    if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`)
    const coins = (await r.json()) as CoinGeckoMarket[]

    // Preserve display order matching CG_IDS
    const ordered = CG_IDS
      .map(id => coins.find(c => c.id === id))
      .filter((c): c is CoinGeckoMarket => !!c)

    const prices = ordered.map(c => ({
      symbol:    CG_SYMBOL[c.id],
      price:     c.current_price,
      change24h: parseFloat((c.price_change_percentage_24h ?? 0).toFixed(2)),
      volume:    fmtVol(c.total_volume),
      sparkline: c.sparkline_in_7d.price.slice(-8), // last 8 hourly closes
    }))

    _sessionCredits += 1
    return { success: true, data: { prices } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Whale Radar — Etherscan token top-holders ────────────────────────────────

const TOKEN_CONTRACTS: Record<string, { address: string; chain: string }> = {
  AAVE: { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', chain: 'ethereum' },
  ETH:  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' },
  BTC:  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chain: 'ethereum' },
  SOL:  { address: 'So11111111111111111111111111111111111111112', chain: 'solana'   },
}

// Known on-chain labels for top WETH/WBTC/AAVE holders
const KNOWN_LABELS: Record<string, string> = {
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance Cold Wallet',
  '0x40b38765696e3d5d8d9d834d8aad4bb6e418e489': 'Robinhood Wallet',
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': 'Binance Hot Wallet',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
  '0x00000000219ab540356cbb839cbe05303d7705fa': 'Beacon Deposit',
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503': 'Binance Whale',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 8',
}

export async function getWhaleIntel(token: string) {
  const contract = TOKEN_CONTRACTS[token]
  if (!contract) return { success: false, error: `Unknown token: ${token}` }
  if (contract.chain !== 'ethereum') return { success: false, error: 'Non-EVM chain' }

  try {
    // Try surf first (local)
    const res = await surf(
      `token-holders --address ${contract.address} --chain ${contract.chain} --include labels --limit 10`
    )
    _sessionCredits += (res.meta as { credits_used: number }).credits_used ?? 1
    const holders = (res.data as Array<{
      address: string; balance: string; entity_name?: string
      percentage: number; label?: { labels?: Array<{ label: string }> }
    }>).map(h => ({
      address: h.address.slice(0, 6) + '...' + h.address.slice(-4),
      name: h.label?.labels?.[0]?.label ?? h.entity_name ?? 'Unknown Wallet',
      percentage: parseFloat(h.percentage.toFixed(2)),
    }))
    return { success: true, data: { holders } }
  } catch {
    // Fallback: Ethplorer freekey — works without any paid plan
    try {
      const r = await fetch(
        `https://api.ethplorer.io/getTopTokenHolders/${contract.address}?apiKey=freekey&limit=10`,
        { cache: 'no-store' }
      )
      if (!r.ok) throw new Error(`Ethplorer HTTP ${r.status}`)
      const j = await r.json() as { holders?: Array<{ address: string; balance: number; share: number }> }
      if (!j.holders?.length) throw new Error('no holders returned')
      const holders = j.holders.map(h => ({
        address: h.address.slice(0, 6) + '...' + h.address.slice(-4),
        name: KNOWN_LABELS[h.address.toLowerCase()] ?? 'Unknown Wallet',
        percentage: parseFloat(h.share.toFixed(2)),
      }))
      return { success: true, data: { holders } }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}

// ─── Prediction Markets — Polymarket public API (crypto markets) ─────────────

function fmtExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const CRYPTO_KEYWORDS = [
  'btc','bitcoin','eth','ethereum','crypto','solana','sol','aave','chainlink',
  'uniswap','arbitrum','optimism','defi','nft','ether','coinbase','binance',
  '$100k','$200k','halving','fed','rate','inflation','gdp','nasdaq','s&p','gold',
]

type PolymarketMarket = {
  question: string
  outcomePrices: string[]
  volume: number
  endDate: string
  active: boolean
  closed: boolean
  category?: string
  tags?: Array<{ slug: string }>
}

export async function getPredictionMarkets() {
  try {
    // Try surf first (local)
    const res = await surf(`kalshi-markets --limit 15`)
    _sessionCredits += (res.meta as { credits_used: number }).credits_used ?? 1
    const raw = res.data as Array<{
      title: string; category?: string; subcategory?: string
      total_volume: number; notional_volume_usd: number
      close_time: number; status: string
    }>
    const markets = raw.filter(m => m.status === 'active').slice(0, 7).map(m => {
      const yes = Math.min(95, Math.max(5, Math.round(
        m.total_volume > 0 ? (m.notional_volume_usd / m.total_volume) * 100 : 50
      )))
      return {
        question: m.title,
        category: m.subcategory ?? m.category ?? 'Market',
        yes, no: 100 - yes,
        volume: fmtVol(m.notional_volume_usd),
        expires: new Date(m.close_time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      }
    })
    return { success: true, data: { markets } }
  } catch {
    // Fallback: Polymarket gamma API — crypto prediction markets, no auth needed
    try {
      const r = await fetch(
        'https://gamma-api.polymarket.com/markets?active=true&closed=false&tag_slug=crypto&limit=20',
        { cache: 'no-store', headers: { Accept: 'application/json' } }
      )
      if (!r.ok) throw new Error(`Polymarket HTTP ${r.status}`)
      const raw = (await r.json()) as PolymarketMarket[]

      // Filter to crypto/financial topics; remove markets with missing prices
      const filtered = raw
        .filter(m => {
          const lower = m.question.toLowerCase()
          return CRYPTO_KEYWORDS.some(kw => lower.includes(kw)) &&
                 Array.isArray(m.outcomePrices) && m.outcomePrices.length >= 2
        })
        .slice(0, 7)

      if (!filtered.length) throw new Error('no crypto markets returned')

      const markets = filtered.map(m => {
        const yes = Math.min(95, Math.max(5, Math.round(parseFloat(m.outcomePrices[0] ?? '0.5') * 100)))
        return {
          question: m.question,
          category: m.category ?? m.tags?.[0]?.slug ?? 'Crypto',
          yes, no: 100 - yes,
          volume: fmtVol(m.volume ?? 0),
          expires: m.endDate ? fmtExpiry(m.endDate) : 'TBD',
        }
      })
      return { success: true, data: { markets } }
    } catch (e) {
      return { success: false, error: String(e) }
    }
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

// ─── On-Chain Metrics — real gas from Etherscan gas oracle (free, no key) ─────

export async function getOnChainMetrics(_chain: string) {
  const base = [12,14,11,9,8,10,14,20,26,32,38,35,28,24,20,18,22,28,34,38,32,24,18,14]
  try {
    const r = await fetch(
      'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
      { cache: 'no-store' }
    )
    const j = await r.json() as {
      status: string
      result: { SafeGasPrice: string; ProposeGasPrice: string; FastGasPrice: string; suggestBaseFee: string }
    }
    if (j.status !== '1') throw new Error('gas oracle error')
    const current = parseInt(j.result.ProposeGasPrice)
    const high    = parseInt(j.result.FastGasPrice)
    const base2   = parseFloat(j.result.suggestBaseFee)
    return {
      success: true,
      data: {
        network: 'ETHEREUM',
        gas: {
          current,
          average: Math.round(base2 + 2),
          high,
          history: base.map(v => Math.round(v * (current / 22))), // scale to current conditions
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
  } catch {
    // Fallback: simulated
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
        activeAddresses: { current: Math.round(460000 + Math.random() * 50000), change: parseFloat((Math.random() * 6 - 2).toFixed(1)) },
        tps: { current: parseFloat((12 + Math.random() * 6).toFixed(1)), peak: parseFloat((18 + Math.random() * 4).toFixed(1)) },
      },
    }
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
    // Try surf first (local)
    const settled = await Promise.allSettled(
      MEMPOOL_TOKENS.map(({ address, chain }) =>
        surf(`token-transfers --address ${address} --chain ${chain} --include labels --limit 30`)
      )
    )
    const alerts: { txHash: string; amount: number; token: string; from: string; to: string; time: string; type: TxType }[] = []
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
          token: tx.symbol, from: labelOf(tx.from_label, tx.from_address),
          to: labelOf(tx.to_label, tx.to_address), time: timeAgo(tx.timestamp),
          type: classifyType(tx.to_label?.entity_type),
        })
      }
    }
    if (!alerts.length) throw new Error('no surf results')
    alerts.sort((a, b) => {
      const aUsd = a.token === 'WETH' ? a.amount * ETH_PRICE_APPROX : a.amount
      const bUsd = b.token === 'WETH' ? b.amount * ETH_PRICE_APPROX : b.amount
      return bUsd - aUsd
    })
    return { success: true, data: { alerts: alerts.slice(0, 12) } }
  } catch {
    // Fallback: Ethplorer freekey — real on-chain USDC + USDT transfers, no paid key needed
    try {
      const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

      const [usdcRes, usdtRes] = await Promise.allSettled([
        fetch(`https://api.ethplorer.io/getTokenHistory/${USDC}?apiKey=freekey&type=transfer&limit=50`, { cache: 'no-store' }),
        fetch(`https://api.ethplorer.io/getTokenHistory/${USDT}?apiKey=freekey&type=transfer&limit=50`, { cache: 'no-store' }),
      ])

      type EthplorerOp = {
        timestamp: number
        transactionHash: string
        from: string
        to: string
        value: string | number
        tokenInfo: { decimals: string; symbol: string; name: string }
      }

      const ops: EthplorerOp[] = []
      for (const res of [usdcRes, usdtRes]) {
        if (res.status !== 'fulfilled' || !res.value.ok) continue
        const j = await res.value.json() as { operations?: EthplorerOp[] }
        if (j.operations) ops.push(...j.operations)
      }

      const alerts = ops
        .map(op => {
          const decimals = parseInt(op.tokenInfo.decimals) || 6
          const amount = parseFloat(String(op.value)) / Math.pow(10, decimals)
          return {
            txHash: op.transactionHash.slice(0, 6) + '...' + op.transactionHash.slice(-4),
            amount: Math.round(amount),
            token: op.tokenInfo.symbol,
            from: op.from.slice(0, 6) + '...' + op.from.slice(-4),
            to:   op.to.slice(0, 6)   + '...' + op.to.slice(-4),
            time: timeAgo(op.timestamp),
            type: 'transfer' as TxType,
          }
        })
        .filter(a => a.amount >= threshold)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 12)

      if (!alerts.length) throw new Error('no large transfers found')
      return { success: true, data: { alerts } }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function getCreditsUsed(): Promise<number> {
  return _sessionCredits
}
