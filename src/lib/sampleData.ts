export const sampleMarketDepth = {
  coins: [
    { symbol: 'BTC', name: 'Bitcoin',  price: 98432.50, change24h:  2.34, volume24h: 28.4e9,  marketCap: 1.94e12, sparkline: [97200,97800,97500,98100,97900,98200,98150,98432] },
    { symbol: 'ETH', name: 'Ethereum', price:  3842.10, change24h: -0.87, volume24h: 14.2e9,  marketCap: 4.61e11, sparkline: [3880,3860,3855,3872,3840,3830,3848,3842] },
    { symbol: 'SOL', name: 'Solana',   price:   187.42, change24h:  5.12, volume24h:  4.8e9,  marketCap: 8.21e10, sparkline: [172,175,178,181,183,185,186,187] },
    { symbol: 'AAVE',name: 'Aave',     price:   312.80, change24h:  3.67, volume24h:  0.62e9, marketCap: 4.68e9,  sparkline: [290,295,298,302,305,308,310,312] },
    { symbol: 'LINK', name: 'Chainlink',price:   18.94, change24h:  1.22, volume24h:  0.95e9, marketCap: 1.11e10, sparkline: [18.1,18.3,18.5,18.6,18.7,18.8,18.9,18.94] },
    { symbol: 'UNI', name: 'Uniswap',  price:   11.72, change24h: -2.14, volume24h:  0.43e9, marketCap: 7.02e9,  sparkline: [12.2,12.1,12.0,11.9,11.85,11.8,11.75,11.72] },
    { symbol: 'ARB', name: 'Arbitrum', price:    0.982, change24h:  4.55, volume24h:  0.38e9, marketCap: 2.48e9,  sparkline: [0.91,0.92,0.93,0.945,0.955,0.965,0.975,0.982] },
    { symbol: 'OP',  name: 'Optimism', price:    2.104, change24h: -1.08, volume24h:  0.29e9, marketCap: 2.73e9,  sparkline: [2.14,2.12,2.10,2.11,2.09,2.10,2.11,2.104] },
  ]
}

export const sampleWhaleRadar: Record<string, { token: string; topHolders: Array<{ address: string; label: string; percentage: number; balance: number }> }> = {
  ETH: {
    token: 'ETH',
    topHolders: [
      { address: '0xBE0e...3a7F', label: 'Beacon Deposit Contract', percentage: 28.4, balance: 34200000 },
      { address: '0x00000...dead', label: 'Binance Cold Wallet', percentage: 11.2, balance: 13480000 },
      { address: '0x47ac...1234', label: 'Wrapped ETH Contract', percentage: 9.8, balance: 11800000 },
      { address: '0xC8e2...89AB', label: 'Kraken Exchange',       percentage: 6.4, balance: 7700000 },
      { address: '0x3f5C...F1E2', label: 'Coinbase Custody',      percentage: 5.1, balance: 6140000 },
      { address: '0x9876...CDEF', label: 'Robinhood Wallet',      percentage: 4.3, balance: 5180000 },
      { address: '0xAABB...5566', label: 'Lido Staking Pool',     percentage: 3.9, balance: 4700000 },
      { address: '0x1122...3344', label: 'OKX Exchange',          percentage: 3.2, balance: 3850000 },
      { address: '0xDEAD...BEEF', label: 'Unknown Whale #1',      percentage: 2.7, balance: 3250000 },
      { address: '0xCAFE...BABE', label: 'Unknown Whale #2',      percentage: 2.1, balance: 2530000 },
    ]
  },
  BTC: {
    token: 'BTC',
    topHolders: [
      { address: '1A1zP...vW18', label: 'Satoshi Genesis Block', percentage: 5.2, balance: 1000001 },
      { address: '3M219...nW9p', label: 'Binance Hot Wallet',   percentage: 14.8, balance: 283000 },
      { address: '34xp4...5YFB', label: 'Bitfinex Cold',        percentage: 8.3,  balance: 159000 },
      { address: '3FHNy...hFHm', label: 'Coinbase Prime',       percentage: 6.9,  balance: 132000 },
      { address: 'bc1q5...4xyz', label: 'Kraken Reserve',       percentage: 5.4,  balance: 103000 },
      { address: 'bc1qg...1234', label: 'MicroStrategy',        percentage: 4.8,  balance: 92000 },
      { address: '1FzWL...pLZJ', label: 'OKX Exchange',         percentage: 4.1,  balance: 78500 },
      { address: '3E5Jo...gAEC', label: 'Unknown Whale #1',     percentage: 3.5,  balance: 67000 },
      { address: 'bc1qv...9AbC', label: 'Unknown Whale #2',     percentage: 2.8,  balance: 53600 },
      { address: 'bc1qx...FFFF', label: 'Gemini Custody',       percentage: 2.2,  balance: 42100 },
    ]
  },
  SOL: {
    token: 'SOL',
    topHolders: [
      { address: 'SRM6s...BuMH', label: 'Solana Foundation',    percentage: 16.2, balance: 146000000 },
      { address: '9WzDX...BT3p', label: 'FTX Estate Wallet',    percentage: 10.8, balance: 97200000 },
      { address: 'Hm37K...nNvS', label: 'Jump Crypto',          percentage: 7.5,  balance: 67500000 },
      { address: 'Gd4xF...Q4mP', label: 'Coinbase Custody',     percentage: 5.9,  balance: 53100000 },
      { address: '3fPbQ...LkMs', label: 'Binance Cold',         percentage: 4.7,  balance: 42300000 },
      { address: 'AWvXR...1mS7', label: 'Multicoin Capital',    percentage: 3.8,  balance: 34200000 },
      { address: 'DKAVn...rZ3Q', label: 'Unknown Whale #1',     percentage: 3.2,  balance: 28800000 },
      { address: 'F3Qx9...PwYb', label: 'Unknown Whale #2',     percentage: 2.6,  balance: 23400000 },
      { address: 'BbChu...7xZz', label: 'OKX Exchange',         percentage: 2.1,  balance: 18900000 },
      { address: 'Crv9K...MbAF', label: 'Kraken Reserve',       percentage: 1.8,  balance: 16200000 },
    ]
  },
}

export const samplePredictions = {
  markets: [
    { id: '1', question: 'BTC above $100k by July 2026?',      yesOdds: 72, volume: 4_280_000,  expiry: 'Jul 31 2026', category: 'Price',    trend: 'up' },
    { id: '2', question: 'ETH to flip BTC in market cap 2026?',yesOdds: 18, volume: 2_140_000,  expiry: 'Dec 31 2026', category: 'Flippening', trend: 'down' },
    { id: '3', question: 'SOL surpasses ETH TVL in DeFi?',     yesOdds: 34, volume: 1_870_000,  expiry: 'Sep 30 2026', category: 'DeFi',     trend: 'up' },
    { id: '4', question: 'Fed cuts rates by 0.5% before Q4?',  yesOdds: 54, volume: 6_920_000,  expiry: 'Sep 16 2026', category: 'Macro',    trend: 'neutral' },
    { id: '5', question: 'New BTC ATH before end of 2026?',    yesOdds: 81, volume: 8_450_000,  expiry: 'Dec 31 2026', category: 'Price',    trend: 'up' },
    { id: '6', question: 'Ethereum ETF daily inflow > $1B?',   yesOdds: 45, volume: 3_310_000,  expiry: 'Aug 15 2026', category: 'Flows',    trend: 'neutral' },
    { id: '7', question: 'ARB token burn approved by DAO?',    yesOdds: 62, volume:   890_000,  expiry: 'Jul 15 2026', category: 'Governance', trend: 'up' },
  ]
}

export const sampleAlphaStream = {
  wordCloud: [
    { word: 'bullish',       weight: 96, sentiment: 'positive' as const },
    { word: 'accumulate',    weight: 88, sentiment: 'positive' as const },
    { word: 'breakout',      weight: 82, sentiment: 'positive' as const },
    { word: 'altseason',     weight: 76, sentiment: 'positive' as const },
    { word: 'correction',    weight: 71, sentiment: 'negative' as const },
    { word: 'institutional', weight: 68, sentiment: 'positive' as const },
    { word: 'liquidation',   weight: 64, sentiment: 'negative' as const },
    { word: 'ETF flows',     weight: 60, sentiment: 'positive' as const },
    { word: 'resistance',    weight: 55, sentiment: 'negative' as const },
    { word: 'degen',         weight: 50, sentiment: 'neutral' as const },
    { word: 'support',       weight: 48, sentiment: 'positive' as const },
    { word: 'overextended',  weight: 44, sentiment: 'negative' as const },
    { word: 'moon',          weight: 42, sentiment: 'positive' as const },
    { word: 'FUD',           weight: 38, sentiment: 'negative' as const },
    { word: 'diamond hands', weight: 35, sentiment: 'positive' as const },
    { word: 'rekt',          weight: 30, sentiment: 'negative' as const },
    { word: 'on-chain',      weight: 28, sentiment: 'neutral' as const },
    { word: 'LFG',           weight: 25, sentiment: 'positive' as const },
    { word: 'risk-off',      weight: 22, sentiment: 'negative' as const },
    { word: 'alpha',         weight: 20, sentiment: 'positive' as const },
  ],
  trending: [
    { topic: '#ETH breakout',       mentions: 24_800, sentiment: 0.84, change: 142 },
    { topic: '#BTC dominance',      mentions: 19_200, sentiment: 0.71, change: 38 },
    { topic: '#SOLana ecosystem',   mentions: 14_600, sentiment: 0.88, change: 215 },
    { topic: '#DeFi summer v2',     mentions: 11_400, sentiment: 0.62, change: 89 },
    { topic: '#AAVE proposal v4',   mentions:  8_700, sentiment: 0.74, change: 57 },
    { topic: '#ARB token burn',     mentions:  6_400, sentiment: 0.59, change: -12 },
    { topic: '#Fed rate cut',       mentions:  5_900, sentiment: 0.45, change: -24 },
  ]
}

function buildHeatmap() {
  const rows = []
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const baseGas = [18,14,12,10,9,10,13,18,24,28,30,28,26,24,22,20,22,26,30,28,24,20,16,14]
  for (const day of days) {
    for (let h = 0; h < 24; h++) {
      const variation = (Math.sin(h * 0.5 + day.length) * 4 + Math.random() * 3)
      const gas = Math.max(5, Math.round(baseGas[h] + variation))
      rows.push({ day, hour: h, gas, intensity: Math.min(1, gas / 40) })
    }
  }
  return rows
}

export const sampleChainPulse = {
  gasHeatmap: buildHeatmap(),
  activeAddresses: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: Math.round(180000 + Math.sin(h * 0.4) * 60000 + Math.random() * 20000),
    label: `${h}:00`,
  })),
  currentGas: { slow: 12, standard: 18, fast: 28, label: 'Gwei' },
}

export const sampleMempool = {
  transactions: [
    { hash: '0xf8a1...3d72', from: '0x1234...dead', fromLabel: 'Whale #Delta',    to: '0xA3B1...CAFE', toLabel: 'Binance Hot',      value: 18_400_000, token: 'USDC', type: 'Transfer',  time: '2s ago',  gas: 28, status: 'pending' },
    { hash: '0x2c8b...a11e', from: '0xBEEF...0001', fromLabel: 'Cumberland DRW',  to: '0x5555...DEED', toLabel: 'Uniswap v4',      value:  7_800_000, token: 'ETH',  type: 'Swap',      time: '5s ago',  gas: 32, status: 'pending' },
    { hash: '0x9f3d...55ab', from: '0xCAFE...BABE', fromLabel: 'Jump Crypto',     to: '0x9999...FFFF', toLabel: 'Aave v3 Pool',    value:  5_200_000, token: 'WBTC', type: 'Deposit',   time: '11s ago', gas: 24, status: 'pending' },
    { hash: '0x7721...c4ff', from: '0x0000...0000', fromLabel: 'Unknown Whale',   to: '0x1111...2222', toLabel: 'Coinbase Prime',  value:  4_100_000, token: 'USDT', type: 'Transfer',  time: '18s ago', gas: 20, status: 'pending' },
    { hash: '0xedc2...8890', from: '0xDEAD...BEEF', fromLabel: 'Alameda Remnant', to: '0x7777...AAAA', toLabel: 'Kraken Exchange', value:  3_750_000, token: 'SOL',  type: 'Transfer',  time: '31s ago', gas: 18, status: 'pending' },
    { hash: '0x4482...1fda', from: '0xABCD...EF01', fromLabel: 'Three Arrows',    to: '0x2468...ACEF', toLabel: 'Maker DAO',       value:  3_200_000, token: 'DAI',  type: 'Liquidate', time: '44s ago', gas: 42, status: 'pending' },
    { hash: '0xbc39...7722', from: '0xF1E2...D3C4', fromLabel: 'Celsius Wallet',  to: '0xAAAA...BBBB', toLabel: 'OKX Exchange',    value:  2_900_000, token: 'USDC', type: 'Transfer',  time: '1m ago',  gas: 22, status: 'confirmed' },
    { hash: '0x5544...3311', from: '0x1357...9ACE', fromLabel: 'Jane Street',     to: '0xCCCC...DDDD', toLabel: 'Uniswap v4',     value:  2_400_000, token: 'ETH',  type: 'Swap',      time: '1m ago',  gas: 26, status: 'confirmed' },
    { hash: '0x8867...4490', from: '0x2468...1357', fromLabel: 'Market Maker X',  to: '0xEEEE...FFFF', toLabel: 'Compound v3',    value:  1_800_000, token: 'WETH', type: 'Deposit',   time: '2m ago',  gas: 16, status: 'confirmed' },
    { hash: '0xaa23...dd89', from: '0xFACE...FEED', fromLabel: 'Unknown Whale',   to: '0x1234...5678', toLabel: 'FTX Estate',      value:  1_200_000, token: 'BTC',  type: 'Transfer',  time: '3m ago',  gas: 14, status: 'confirmed' },
  ]
}
