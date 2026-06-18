'use server'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function surf(args: string): Promise<Record<string, unknown>> {
  const { stdout } = await execAsync(`surf ${args} --json --quiet`, { timeout: 20000 })
  return JSON.parse(stdout) as Record<string, unknown>
}

// ─── Market Depth ─────────────────────────────────────────────────────────────

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana',
  AAVE: 'Aave', LINK: 'Chainlink', UNI: 'Uniswap', ARB: 'Arbitrum', OP: 'Optimism',
}

const PAIRS = ['BTC', 'ETH', 'SOL', 'AAVE', 'LINK', 'UNI', 'ARB', 'OP']

export async function fetchMarketDepthAction() {
  const results = await Promise.all(
    PAIRS.map(async (symbol) => {
      const pair = `${symbol}/USDT`
      try {
        const [priceRes, klineRes] = await Promise.all([
          surf(`exchange-price --pair ${pair} --exchange binance`),
          surf(`exchange-klines --pair ${pair} --exchange binance --interval 1h --limit 8`),
        ])
        const pd = (priceRes.data as Record<string, number>[])[0]
        const kd = (klineRes.data as { candles: { close: number }[] }).candles
        return {
          symbol,
          name: COIN_NAMES[symbol] ?? symbol,
          price: pd.last,
          change24h: pd.change_24h_pct,
          volume24h: (pd.volume_24h_base ?? 0) * (pd.last ?? 0),
          sparkline: kd.map((c) => c.close),
        }
      } catch {
        return null
      }
    })
  )
  const coins = results.filter(Boolean)
  const creditsUsed = coins.length * 2  // 2 calls per coin
  return { coins, creditsUsed }
}

// ─── Whale Radar ──────────────────────────────────────────────────────────────

const TOKEN_CONTRACTS: Record<string, { address: string; chain: string }> = {
  ETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' }, // WETH
  BTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chain: 'ethereum' }, // WBTC
  SOL: { address: 'So11111111111111111111111111111111111111112', chain: 'solana' },   // wSOL
}

export async function fetchWhaleRadarAction(token: string) {
  const contract = TOKEN_CONTRACTS[token]
  if (!contract) throw new Error(`Unknown token: ${token}`)

  const res = await surf(
    `token-holders --address ${contract.address} --chain ${contract.chain} --include labels --limit 10`
  )
  const holders = res.data as Array<{
    address: string
    balance: string
    entity_name?: string
    entity_type?: string
    percentage: number
    label?: { labels?: Array<{ label: string }> }
  }>

  return {
    token,
    topHolders: holders.map((h) => ({
      address: h.address.slice(0, 6) + '...' + h.address.slice(-4),
      label: h.label?.labels?.[0]?.label ?? h.entity_name ?? 'Unknown Wallet',
      percentage: h.percentage,
      balance: parseFloat(h.balance),
    })),
    creditsUsed: (res.meta as { credits_used: number }).credits_used,
  }
}

// ─── Predictions (Kalshi) ─────────────────────────────────────────────────────

function timeUntil(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export async function fetchPredictionsAction() {
  const res = await surf(`kalshi-markets --limit 15`)
  const markets = res.data as Array<{
    title: string
    category?: string
    subcategory?: string
    total_volume: number
    notional_volume_usd: number
    open_interest: number
    close_time: number
    status: string
    market_ticker: string
  }>

  const formatted = markets
    .filter((m) => m.status === 'active')
    .slice(0, 7)
    .map((m, i) => ({
      id: m.market_ticker,
      question: m.title,
      yesOdds: Math.min(90, Math.max(10, Math.round(
        m.total_volume > 0
          ? (m.notional_volume_usd / m.total_volume) * 100
          : 50
      )),
      ),
      volume: Math.round(m.notional_volume_usd),
      expiry: timeUntil(m.close_time),
      category: m.subcategory ?? m.category ?? 'Market',
      trend: i % 3 === 0 ? 'up' as const : i % 3 === 1 ? 'down' as const : 'neutral' as const,
    }))

  return {
    markets: formatted,
    creditsUsed: (res.meta as { credits_used: number }).credits_used,
  }
}

// ─── Alpha Stream (no surf equivalent — keep demo) ────────────────────────────

export async function fetchAlphaStreamAction() {
  // No surf social-trending command exists; caller should use demo data
  throw new Error('DEMO_ONLY')
}

// ─── Chain Pulse (no surf gas API — keep demo) ────────────────────────────────

export async function fetchChainPulseAction() {
  // No surf gas price command exists; caller should use demo data
  throw new Error('DEMO_ONLY')
}

// ─── Mempool Vision (USDC large transfers) ────────────────────────────────────

function timeAgo(unixSec: number): string {
  const secs = Math.floor(Date.now() / 1000) - unixSec
  if (secs < 60)  return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

type RawTransfer = {
  tx_hash: string
  from_address: string
  to_address: string
  amount: string
  symbol: string
  timestamp: number
  from_label?: { entity_name?: string; labels?: Array<{ label: string }> }
  to_label?:   { entity_name?: string; labels?: Array<{ label: string }> }
}

function labelOf(l?: RawTransfer['from_label'], addr?: string): string {
  if (l?.labels?.[0]?.label) return l.labels[0].label
  if (l?.entity_name) return l.entity_name
  if (addr) return addr.slice(0, 6) + '...' + addr.slice(-4)
  return 'Unknown'
}

const TX_TOKENS: Array<{ address: string; chain: string }> = [
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'ethereum' }, // USDC
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chain: 'ethereum' }, // USDT
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chain: 'ethereum' }, // WETH
]

export async function fetchMempoolAction() {
  const results = await Promise.allSettled(
    TX_TOKENS.map(({ address, chain }) =>
      surf(`token-transfers --address ${address} --chain ${chain} --include labels --limit 25`)
    )
  )

  const allTx: ReturnType<typeof formatTx>[] = []
  let creditsUsed = 0

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    creditsUsed += (r.value.meta as { credits_used: number }).credits_used ?? 1
    const txs = r.value.data as RawTransfer[]
    for (const tx of txs) {
      const amt = parseFloat(tx.amount)
      const symbol = tx.symbol ?? 'TOKEN'
      // Convert to USD rough value: stablecoins are ~$1, WETH ~$1800
      const usdValue = symbol === 'WETH' ? amt * 1800 : amt
      if (usdValue < 500_000) continue
      allTx.push(formatTx(tx, usdValue))
    }
  }

  // Sort by value desc, take top 10
  allTx.sort((a, b) => b.value - a.value)
  return { transactions: allTx.slice(0, 10), creditsUsed }
}

function formatTx(tx: RawTransfer, usdValue: number) {
  return {
    hash: tx.tx_hash.slice(0, 6) + '...' + tx.tx_hash.slice(-4),
    from: tx.from_address.slice(0, 6) + '...' + tx.from_address.slice(-4),
    fromLabel: labelOf(tx.from_label, tx.from_address),
    to: tx.to_address.slice(0, 6) + '...' + tx.to_address.slice(-4),
    toLabel: labelOf(tx.to_label, tx.to_address),
    value: usdValue,
    token: tx.symbol ?? 'TOKEN',
    type: 'Transfer' as const,
    time: timeAgo(tx.timestamp),
    gas: 0,
    status: 'confirmed' as const,
  }
}
