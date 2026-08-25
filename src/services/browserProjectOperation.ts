import {BrowserOperationError} from './browserRuntimeContract.ts'

export type BrowserProjectOperationLease = {
  readonly signal: AbortSignal
  assertCurrent(): void
  cancel(): void
  finish(): void
}

export class BrowserProjectOperationCoordinator {
  #generation = 0
  #controller: AbortController | null = null
  #removeOwnerAbortListener: (() => void) | null = null

  #invalidateCurrent(): void {
    this.#removeOwnerAbortListener?.()
    this.#removeOwnerAbortListener = null
    this.#controller?.abort()
    this.#controller = null
  }

  begin(ownerSignal?: AbortSignal): BrowserProjectOperationLease {
    this.#invalidateCurrent()
    this.#generation += 1
    const generation = this.#generation
    const controller = new AbortController()
    this.#controller = controller

    const onOwnerAbort = () => controller.abort()
    if (ownerSignal) {
      ownerSignal.addEventListener('abort', onOwnerAbort, {once: true})
      this.#removeOwnerAbortListener = () => ownerSignal.removeEventListener('abort', onOwnerAbort)
      if (ownerSignal.aborted) onOwnerAbort()
    }

    const isCurrent = () => (
      this.#generation === generation
      && this.#controller === controller
      && !controller.signal.aborted
    )
    const removeOwnerListener = () => ownerSignal?.removeEventListener('abort', onOwnerAbort)

    return {
      signal: controller.signal,
      assertCurrent: () => {
        if (!isCurrent()) throw new BrowserOperationError('OPERATION_CANCELLED', '操作已取消')
      },
      cancel: () => {
        removeOwnerListener()
        if (this.#generation === generation && this.#controller === controller) {
          this.cancel()
        } else {
          controller.abort()
        }
      },
      finish: () => {
        removeOwnerListener()
        if (this.#generation === generation && this.#controller === controller) {
          this.#removeOwnerAbortListener = null
          this.#controller = null
        }
      },
    }
  }

  cancel(): void {
    this.#invalidateCurrent()
    this.#generation += 1
  }
}

export const browserProjectOperationCoordinator = new BrowserProjectOperationCoordinator()
export const browserImportOperationCoordinator = new BrowserProjectOperationCoordinator()
