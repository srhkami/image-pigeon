import assert from 'node:assert/strict'
import test from 'node:test'

import {BrowserOperationError} from './browserRuntimeContract.ts'
import {BrowserProjectOperationCoordinator} from './browserProjectOperation.ts'

test('新專案操作會取消舊操作，只有目前世代可以 commit', () => {
  const coordinator = new BrowserProjectOperationCoordinator()
  const first = coordinator.begin()
  const second = coordinator.begin()

  assert.equal(first.signal.aborted, true)
  assert.throws(
    () => first.assertCurrent(),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
  assert.doesNotThrow(() => second.assertCurrent())
})

test('全部清除可取消目前專案操作並阻止晚到 commit', () => {
  const coordinator = new BrowserProjectOperationCoordinator()
  const operation = coordinator.begin()

  coordinator.cancel()

  assert.equal(operation.signal.aborted, true)
  assert.throws(
    () => operation.assertCurrent(),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
})

test('非同步結果在全部清除後晚到時不會執行 commit', async () => {
  const coordinator = new BrowserProjectOperationCoordinator()
  const operation = coordinator.begin()
  let release!: () => void
  const delayed = new Promise<void>(resolve => {
    release = resolve
  })
  let commits = 0
  const work = (async () => {
    await delayed
    operation.assertCurrent()
    commits += 1
  })()

  coordinator.cancel()
  release()

  await assert.rejects(
    work,
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
  assert.equal(commits, 0)
})

test('舊操作 finish 不會清除新操作的擁有權', () => {
  const coordinator = new BrowserProjectOperationCoordinator()
  const first = coordinator.begin()
  const second = coordinator.begin()

  first.finish()

  assert.doesNotThrow(() => second.assertCurrent())
  assert.equal(second.signal.aborted, false)
})

test('元件擁有的 AbortSignal 會同步取消共享專案操作', () => {
  const coordinator = new BrowserProjectOperationCoordinator()
  const owner = new AbortController()
  const operation = coordinator.begin(owner.signal)

  owner.abort()

  assert.equal(operation.signal.aborted, true)
  assert.throws(
    () => operation.assertCurrent(),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
})
