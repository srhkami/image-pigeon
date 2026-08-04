export type FrontendDiagnostic = {
  event: 'frontend.request_failed' | 'frontend.check_status_failed'
  route: '/api/images/import' | '/api/images/import-long-screen' | '/api/project/save' | '/api/project/open' | 'pywebview.api'
  status: number
  error_type: 'network_error' | 'non_json_response' | 'http_error' | 'invalid_response'
  detail_code: 'fetch_failed' | 'non_json' | 'non_2xx' | 'invalid_response' | 'status_not_200'
  duration_ms: number
  operation_id: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const EVENTS = new Set<FrontendDiagnostic['event']>(['frontend.request_failed', 'frontend.check_status_failed'])
const ROUTES = new Set<FrontendDiagnostic['route']>([
  '/api/images/import', '/api/images/import-long-screen', '/api/project/save', '/api/project/open', 'pywebview.api',
])
const ERROR_TYPES = new Set<FrontendDiagnostic['error_type']>(['network_error', 'non_json_response', 'http_error', 'invalid_response'])
const DETAIL_CODES = new Set<FrontendDiagnostic['detail_code']>(['fetch_failed', 'non_json', 'non_2xx', 'invalid_response', 'status_not_200'])

function isFrontendDiagnostic(value: unknown): value is FrontendDiagnostic {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  const keys = Object.keys(payload)
  if (keys.length !== 7 || keys.some(key => !['event', 'route', 'status', 'error_type', 'detail_code', 'duration_ms', 'operation_id'].includes(key))) return false
  return EVENTS.has(payload.event as FrontendDiagnostic['event'])
    && ROUTES.has(payload.route as FrontendDiagnostic['route'])
    && ERROR_TYPES.has(payload.error_type as FrontendDiagnostic['error_type'])
    && DETAIL_CODES.has(payload.detail_code as FrontendDiagnostic['detail_code'])
    && typeof payload.status === 'number' && Number.isInteger(payload.status) && payload.status >= 100 && payload.status <= 599
    && typeof payload.duration_ms === 'number' && Number.isInteger(payload.duration_ms) && payload.duration_ms >= 0 && payload.duration_ms <= 86_400_000
    && typeof payload.operation_id === 'string' && UUID.test(payload.operation_id)
}

export function newDiagnosticOperationId(): string {
  return crypto.randomUUID()
}

export async function reportFrontendDiagnostic(payload: FrontendDiagnostic): Promise<void> {
  if (!isFrontendDiagnostic(payload)) return
  const bridge = window.pywebview?.api.record_frontend_diagnostic
  if (!bridge) return
  try {
    await bridge(payload)
  } catch {
    // Diagnostic reporting must never affect the primary operation or recurse.
  }
}
