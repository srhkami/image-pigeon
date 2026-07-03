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
    erroredImages,
    isReady,
    notifyImageLoaded,
    notifyImageErrored,
  } = usePrintImageReadiness(printImageItemIds)

  const onPrint = () => {
    window.print()
  }
  
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
         <Button onClick={onBackToEditor}>返回編輯</Button>
        <div className='print-preview-pages'>
          共 {pages.length} 頁
        </div>
        <Button
            onClick={onPrint}
            color='primary'
            className='ml-2'
            disabled={!isReady}
          >
            列印
          </Button>
      </footer>
      {erroredImages > 0 && (
        <div className='print-preview-warning'>
          <p>有 {erroredImages} 張圖片載入失敗，將以空白顯示，仍可列印。</p>
        </div>
      )}
    </div>
  )
}
