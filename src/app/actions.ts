'use server'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function runSurf(args: string): Promise<unknown> {
  const { stdout } = await execAsync(`surf ${args} --output json`, { timeout: 15000 })
  return JSON.parse(stdout)
}

export async function fetchMarketDepthAction() {
  const data = await runSurf('market --coins BTC,ETH,SOL,AAVE,LINK,UNI,ARB,OP')
  return data
}

export async function fetchWhaleRadarAction(token: string) {
  const data = await runSurf(`whales --token ${token} --top 10`)
  return data
}

export async function fetchPredictionsAction() {
  const data = await runSurf('predictions --limit 10')
  return data
}

export async function fetchAlphaStreamAction() {
  const data = await runSurf('alpha --sentiment --trending')
  return data
}

export async function fetchChainPulseAction() {
  const data = await runSurf('gas --heatmap --addresses')
  return data
}

export async function fetchMempoolAction() {
  const data = await runSurf('mempool --min-value 1000000 --limit 20')
  return data
}
