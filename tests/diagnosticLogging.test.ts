import assert from 'node:assert/strict'
import test from 'node:test'

import {reportFrontendDiagnostic} from '../src/services/diagnosticLog.ts'

const operationId = '123e4567-e89b-12d3-a456-426614174000'

test('前端診斷只將固定欄位交給固定 pywebview bridge', async () => {
  const calls: unknown[] = []
  ;(globalThis as typeof globalThis & {window: Window}).window = {
    pywebview: {
      api: {
        record_frontend_diagnostic: async (payload: unknown) => {
          calls.push(payload)
          return {status: 200, message: '診斷事件已接受', data: null}
        },
      },
    },
  } as unknown as Window

  await reportFrontendDiagnostic({
    event: 'frontend.request_failed',
    route: '/api/images/import',
    status: 503,
    error_type: 'network_error',
    detail_code: 'fetch_failed',
    duration_ms: 12,
    operation_id: operationId,
  })

  assert.deepEqual(calls, [{
    event: 'frontend.request_failed',
    route: '/api/images/import',
    status: 503,
    error_type: 'network_error',
    detail_code: 'fetch_failed',
    duration_ms: 12,
    operation_id: operationId,
  }])
})

test('bridge 缺少、拒絕或失敗時靜默降級且不送出自由文字', async () => {
  const calls: unknown[] = []
  const payload = {
    event: 'frontend.request_failed' as const,
    route: '/api/images/import' as const,
    status: 500,
    error_type: 'http_error' as const,
    detail_code: 'non_2xx' as const,
    duration_ms: 0,
    operation_id: operationId,
  }
  ;(globalThis as typeof globalThis & {window: Window}).window = {
    pywebview: {
      api: {
        record_frontend_diagnostic: async (value: unknown) => {
          calls.push(value)
          throw new Error('bridge failed')
        },
      },
    },
  } as unknown as Window

  await assert.doesNotReject(() => reportFrontendDiagnostic(payload))
  assert.deepEqual(calls, [payload])

  await assert.doesNotReject(() => reportFrontendDiagnostic({
    ...payload,
    message: 'private error text',
    stack: 'private stack',
  } as never))
  assert.deepEqual(calls, [payload])

  ;(globalThis as typeof globalThis & {window: Window}).window = {} as Window
  await assert.doesNotReject(() => reportFrontendDiagnostic(payload))
})
