import {newDiagnosticOperationId, reportFrontendDiagnostic} from '../services/diagnosticLog.ts'
import {Response} from './type.ts'

/* 檢查返回的狀態，如果不是 200，則拋出錯誤訊息。 */
export function checkStatus(res: Response<unknown>) {
  if (res.status !== 200) {
    void reportFrontendDiagnostic({
      event: 'frontend.check_status_failed',
      route: 'pywebview.api',
      status: res.status >= 100 && res.status <= 599 ? res.status : 500,
      error_type: 'http_error',
      detail_code: 'status_not_200',
      duration_ms: 0,
      operation_id: newDiagnosticOperationId(),
    })
    throw new Error(res.message)
  }
}
