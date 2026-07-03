import {useMemo} from 'react'
import {Button} from '@/component'
import PrintableDocument from '@/features/PrintPreview/PrintableDocument.tsx'
import {buildAutoCollageLayout} from '@/features/ImagePreview/autoCollageLayout.ts'
import {buildPrintableSlotIndexMap, getPrintableImageItemIds, PrintAlignVertical, PrintFontSize} from '@/features/PrintPreview/printLayout.ts'
import {getOrderedItemViewModels} from '@/state/projectState.ts'
import {ProjectV2} from '@/types/project.ts'
import {usePrintImageReadiness} from '@/features/PrintPreview/usePrintImageReadiness.ts'

import './printPreview.css'

type Props = {
  readonly project: ProjectV2
  readonly sessionId: string | null
  readonly title: string
  readonly fontSize: PrintFontSize
  readonly alignVertical: PrintAlignVertical
  readonly onBackToEditor: () => void
}

export default function PrintPreviewView({
  project,
  sessionId,
  title,
  fontSize,
  alignVertical,
  onBackToEditor,
}: Props) {
  const viewModels = useMemo(
    () => getOrderedItemViewModels(project, sessionId ?? ''),
    [project, sessionId],
  )
  const pages = useMemo(() => buildAutoCollageLayout(viewModels), [viewModels])
  const slotIndexMap = useMemo(() => buildPrintableSlotIndexMap(pages), [pages])
  const printImageItemIds = useMemo(() => getPrintableImageItemIds(pages), [pages])

  const {
    totalImages,
    loadedImages,
    erroredImages,
    isReady,
    notifyImageLoaded,
    notifyImageErrored,
  } = usePrintImageReadiness(printImageItemIds)

  const onPrint = () => {
    window.print()
  }

  const loadingState = isReady
    ? `圖片已準備完成（共 ${totalImages} 張）`
    : `載入中：${loadedImages}/${totalImages} 張 (${erroredImages > 0 ? `失敗 ${erroredImages} 張` : '未完成'})`

  const previewStatusClass = erroredImages > 0
    ? 'text-warning text-sm'
    : isReady
      ? 'text-success text-sm'
      : 'text-info text-sm'

  return (
    <div className='print-preview-shell'>
      <main className='print-preview-main'>
        <div className='print-preview-stage'>
          <PrintableDocument
            project={project}
            sessionId={sessionId ?? ''}
            pages={pages}
            slotIndexMap={slotIndexMap}
            title={title}
            fontSize={fontSize}
            alignVertical={alignVertical}
            onImageLoaded={notifyImageLoaded}
            onImageErrored={notifyImageErrored}
          />
        </div>
      </main>

      <footer className='print-preview-chrome'>
        <div className='print-preview-pages'>
          第 {pages.length} 頁
          <span className='mx-2'>｜</span>
          <span className={previewStatusClass}>{loadingState}</span>
        </div>
        <div className='print-preview-actions'>
          <Button onClick={onBackToEditor}>返回編輯</Button>
          <Button
            onClick={onPrint}
            color='primary'
            className='ml-2'
            disabled={!isReady}
          >
            列印
          </Button>
        </div>
      </footer>

      {erroredImages > 0 && (
        <div className='print-preview-warning'>
          <p>有 {erroredImages} 張圖片載入失敗，將以空白顯示，仍可列印。</p>
        </div>
      )}

    </div>
  )
}
