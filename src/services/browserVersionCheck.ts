import type {VersionCheckData} from '@/utils/type.ts'
import {VERSION_CHECK_URL} from './browserNetworkPolicy.ts'

const VERSION_CHECK_TIMEOUT_MS = 5_000

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function isVersionCheckData(value: unknown): value is VersionCheckData {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  if (typeof payload.app_version !== 'string' || !payload.app_version.trim()) return false
  if (typeof payload.whats_new !== 'string') return false
  if (typeof payload.updated_at !== 'string' || Number.isNaN(Date.parse(payload.updated_at))) return false
  if (typeof payload.download_link !== 'string') return false
  try {
    const url = new URL(payload.download_link)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  } catch {
    return false
  }
  return true
}

export async function checkBrowserVersion(fetcher: FetchLike = fetch): Promise<VersionCheckData | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), VERSION_CHECK_TIMEOUT_MS)
  try {
    const response = await fetcher(VERSION_CHECK_URL, {method: 'GET', credentials: 'omit', signal: controller.signal})
    if (!response.ok) return null
    const payload: unknown = await response.json()
    return isVersionCheckData(payload) ? payload : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
