import {newDiagnosticOperationId, reportFrontendDiagnostic, type FrontendDiagnostic} from './diagnosticLog.ts'

export type APIErrorPayload = {
  status?: number
  message?: string
  detail?: string
}

type Method = 'GET' | 'POST'
type QueryValue = string | number | boolean | null | undefined
type RequestOptions = {
  method?: Method
  headers?: HeadersInit
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

const DIAGNOSTIC_ROUTES = new Set<FrontendDiagnostic['route']>([
  '/api/images/import', '/api/images/import-long-screen', '/api/project/save', '/api/project/open',
])

const createErrorMessage = (payload: APIErrorPayload | null, fallback: string): string => {
  const message = payload?.message
  const detail = payload?.detail
  if (typeof message !== 'string') return fallback
  if (typeof detail === 'string' && detail.trim()) return `${message} (${detail})`
  return message
}

function reportRequestFailure(
  path: string,
  status: number,
  error_type: FrontendDiagnostic['error_type'],
  detail_code: FrontendDiagnostic['detail_code'],
  startedAt: number,
): void {
  if (!DIAGNOSTIC_ROUTES.has(path as FrontendDiagnostic['route'])) return
  void reportFrontendDiagnostic({
    event: 'frontend.request_failed',
    route: path as FrontendDiagnostic['route'],
    status,
    error_type,
    detail_code,
    duration_ms: Math.min(86_400_000, Math.max(0, Math.round(performance.now() - startedAt))),
    operation_id: newDiagnosticOperationId(),
  })
}

export async function requestJson<T>(
  path: string,
  options: RequestOptions & {body?: BodyInit | Record<string, unknown>} = {},
): Promise<T> {
  const startedAt = performance.now()
  const {method = 'GET', body, headers, query, signal} = options
  const finalHeaders = new Headers(headers)
  const url = new URL(path, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, `${value}`)
    })
  }

  const request: RequestInit = {method, signal, headers: finalHeaders}
  if (body !== undefined) {
    if (body instanceof FormData) request.body = body
    else {
      request.body = JSON.stringify(body)
      finalHeaders.set('Content-Type', 'application/json')
    }
  }
  request.headers = finalHeaders

  let res: Response
  try {
    res = await fetch(url.toString(), request)
  } catch (error) {
    reportRequestFailure(path, 503, 'network_error', 'fetch_failed', startedAt)
    throw error
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    reportRequestFailure(path, res.status, 'non_json_response', 'non_json', startedAt)
    throw new Error(`${res.status} ${res.statusText}`)
  }

  if (!res.ok) {
    reportRequestFailure(path, res.status, 'http_error', 'non_2xx', startedAt)
    throw new Error(createErrorMessage(raw as APIErrorPayload, `${res.status} ${res.statusText}`))
  }
  if (raw && typeof raw === 'object') {
    const payload = raw as APIErrorPayload
    if (typeof payload.status === 'number' && payload.status >= 400) {
      reportRequestFailure(path, payload.status, 'http_error', 'non_2xx', startedAt)
      throw new Error(createErrorMessage(payload, `${res.status} ${res.statusText}`))
    }
  }
  if (raw === null) {
    reportRequestFailure(path, res.status, 'invalid_response', 'invalid_response', startedAt)
    throw new Error('回應資料格式不正確')
  }
  return raw as T
}
