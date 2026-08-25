export const VERSION_CHECK_URL = 'https://api.pigeonhand.tw/web/apps/1/'

export type BrowserNetworkRequest = {
  url: string
  method?: string
  body?: unknown
  credentials?: RequestCredentials
  headers?: HeadersInit
}

export type BrowserNetworkDecision =
  | {allowed: true; kind: 'local-blob' | 'static-get' | 'version-get'}
  | {allowed: false; reason: 'METHOD_NOT_ALLOWED' | 'ORIGIN_NOT_ALLOWED' | 'VERSION_REQUEST_NOT_MINIMAL'}

const hasHeaders = (headers?: HeadersInit) => {
  if (!headers) return false
  return [...new Headers(headers).keys()].length > 0
}

export function decideBrowserNetworkRequest(
  request: BrowserNetworkRequest,
  applicationOrigin: string,
): BrowserNetworkDecision {
  const method = (request.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return {allowed: false, reason: 'METHOD_NOT_ALLOWED'}

  const url = new URL(request.url, applicationOrigin)
  if (url.protocol === 'blob:') return {allowed: true, kind: 'local-blob'}
  if (url.origin === applicationOrigin) return {allowed: true, kind: 'static-get'}

  if (url.href !== VERSION_CHECK_URL) return {allowed: false, reason: 'ORIGIN_NOT_ALLOWED'}
  if (request.body !== undefined || (request.credentials !== undefined && request.credentials !== 'omit') || hasHeaders(request.headers)) {
    return {allowed: false, reason: 'VERSION_REQUEST_NOT_MINIMAL'}
  }
  return {allowed: true, kind: 'version-get'}
}
