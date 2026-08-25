import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('儲存專案由瀏覽器建立單一 .ipigeon 且不依賴 pywebview 或 project API', () => {
  const source = readSource('../Output/SaveProject.tsx')

  assert.match(source, /createProjectArchive\(nextProject, browserAssetStore, controller\.signal\)/)
  const afterArchive = source.slice(source.indexOf('await createProjectArchive'))
  const finalCancellationCheck = afterArchive.indexOf('throwIfAborted(controller.signal)')
  assert.ok(finalCancellationCheck >= 0)
  assert.ok(finalCancellationCheck < afterArchive.indexOf('URL.createObjectURL(archive)'))
  assert.match(source, /anchor\.download\s*=\s*.*\.ipigeon/)
  assert.doesNotMatch(source, /pywebview|saveProject\(/)
  assert.doesNotMatch(source, /sessionId/)
})

test('全部清除會取消一般圖片與長截圖匯入並阻止晚到狀態提交', () => {
  const appSource = readSource('../../App.tsx')
  const modalSource = readSource('./ModalImport.tsx')
  const multipleSource = readSource('./UploadMultiple.tsx')
  const longScreenSource = readSource('./UploadLongScreen.tsx')

  assert.match(modalSource, /browserImportOperationCoordinator\.begin\(\)/)
  assert.match(modalSource, /operationRef\.current\?\.cancel\(\)/)
  assert.match(appSource, /browserImportOperationCoordinator\.cancel\(\)[\s\S]*browserAssetStore\.clear\(\)/)
  for (const source of [multipleSource, longScreenSource]) {
    const afterImport = source.slice(source.indexOf('await showToast'))
    const finalCancellationCheck = afterImport.indexOf('throwIfAborted(signal)')
    assert.ok(finalCancellationCheck >= 0)
    assert.ok(finalCancellationCheck < afterImport.indexOf('setProject('))
  }
})

test('開啟專案支援單檔與資料夾並在驗證完成後原子替換 store', () => {
  const source = readSource('./OpenProject.tsx')
  const appSource = readSource('../../App.tsx')

  assert.match(source, /accept=['"]\.ipigeon['"]/)
  assert.match(source, /webkitdirectory/)
  assert.match(source, /openProjectArchive\(/)
  assert.match(source, /openProjectFolder\(/)
  assert.match(source, /browserProjectOperationCoordinator\.begin\(\)/)
  assert.match(source, /lease\.assertCurrent\(\)/)
  assert.match(source, /browserAssetStore\.replaceAll\(opened\.assets\)/)
  const runOpenSource = source.slice(source.indexOf('const runOpen ='), source.indexOf('const confirmThenSelect ='))
  assert.ok(runOpenSource.indexOf('lease.assertCurrent()') < runOpenSource.indexOf('applyOpenedProject(opened)'))
  assert.match(appSource, /browserProjectOperationCoordinator\.cancel\(\)[\s\S]*browserAssetStore\.clear\(\)/)
  assert.doesNotMatch(source, /pywebview|openProject\(/)
})

test('1.x JSON 匯入完整替換 ProjectV2 與 asset store 而非只更新 legacy images state', () => {
  const source = readSource('./ReadJson.tsx')

  assert.match(source, /migrateLegacyProjectJson\(/)
  assert.match(source, /browserImageProcessor\.processLegacyImage/)
  assert.match(source, /browserAssetStore\.replaceAll\(migrated\.assets\)/)
  assert.match(source, /setProject\(migrated\.project\)/)
  assert.doesNotMatch(source, /CustomImage\.fromBase64/)
})

test('專案儲存、開啟與 1.x 遷移都有取消與世代生命週期', () => {
  const saveSource = readSource('../Output/SaveProject.tsx')
  const openSource = readSource('./OpenProject.tsx')
  const legacySource = readSource('./ReadJson.tsx')
  const modalSource = readSource('./ModalImport.tsx')

  assert.match(saveSource, /new AbortController\(\)/)
  assert.match(saveSource, /\.abort\(\)/)
  assert.match(modalSource, /browserImportOperationCoordinator\.begin\(\)/)
  assert.match(modalSource, /operationRef\.current\?\.cancel\(\)/)
  assert.match(openSource, /operationRef\.current\?\.cancel\(\)/)
  assert.match(openSource, /lease\.assertCurrent\(\)/)
  assert.match(legacySource, /const ownerSignal = beginImport\(\)/)
  assert.match(legacySource, /browserProjectOperationCoordinator\.begin\(ownerSignal\)/)
  assert.match(legacySource, /lease\.assertCurrent\(\)/)
  assert.match(legacySource, /finishImport\(ownerSignal\)/)
})
