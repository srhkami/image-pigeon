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

const createErrorMessage = (payload: APIErrorPayload | null, fallback: string): string => {
  const message = payload?.message
  const detail = payload?.detail
  if (typeof message !== 'string') {
    return fallback
  }
  if (typeof detail === 'string' && detail.trim()) {
    return `${message} (${detail})`
  }
  return message
}

export async function requestJson<T>(
  path: string,
  options: RequestOptions & {body?: BodyInit | Record<string, unknown>} = {},
): Promise<T> {
  const {method = 'GET', body, headers, query, signal} = options
  const finalHeaders = new Headers(headers)

  const url = new URL(path, window.location.origin)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      url.searchParams.append(key, `${value}`)
    })
  }

  const request: RequestInit = {
    method,
    signal,
    headers: finalHeaders,
  }

  if (body !== undefined) {
    if (body instanceof FormData) {
      request.body = body
    } else {
      request.body = JSON.stringify(body)
      finalHeaders.set('Content-Type', 'application/json')
    }
  }

  request.headers = finalHeaders

  const res = await fetch(url.toString(), request)
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    raw = null
  }

  if (!res.ok) {
    throw new Error(createErrorMessage(raw as APIErrorPayload, `${res.status} ${res.statusText}`))
  }

  if (raw && typeof raw === 'object') {
    const payload = raw as APIErrorPayload
    if (typeof payload.status === 'number' && payload.status >= 400) {
      throw new Error(createErrorMessage(payload, `${res.status} ${res.statusText}`))
    }
  }

  if (raw === null) {
    throw new Error('回應資料格式不正確')
  }

  return raw as T
}
