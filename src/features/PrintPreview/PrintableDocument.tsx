import {ProjectV2} from '@/types/project.ts'
import {AutoCollagePage, buildAutoCollageLayout} from '@/features/ImagePreview/autoCollageLayout.ts'
import {buildPrintableSlotIndexMap} from '@/features/PrintPreview/printLayout.ts'
import {getOrderedItemViewModels} from '@/state/projectState.ts'
import PrintablePage from '@/features/PrintPreview/PrintablePage.tsx'
import {ProjectItemViewModel} from '@/types/project.ts'

type Props = {
  readonly project: ProjectV2
  readonly sessionId: string
  readonly pages?: AutoCollagePage[]
  readonly slotIndexMap?: Record<string, number | null>
  readonly title: string
  readonly fontSize: '16' | '20' | '24'
  readonly alignVertical: 'top' | 'center'
  readonly onImageLoaded: (itemId: string) => void
  readonly onImageErrored: (itemId: string) => void
}

export default function PrintableDocument({
  project,
  sessionId,
  pages: providedPages,
  slotIndexMap: providedSlotIndexMap,
  title,
  fontSize,
  alignVertical,
  onImageLoaded,
  onImageErrored,
}: Props) {
  const orderedItems = getOrderedItemViewModels(project, sessionId)
  const itemById = new Map<string, ProjectItemViewModel>(orderedItems.map((item) => [item.itemId, item]))

  const pages = providedPages ?? buildAutoCollageLayout(orderedItems)
  const slotIndexMap = providedSlotIndexMap ?? buildPrintableSlotIndexMap(pages)

  if (pages.length === 0) {
    return <div className='print-document-empty'>目前無可列印頁面，請先新增圖片。</div>
  }

  return (
    <div className='print-document'>
      <div className='print-document-title'>
        <h1>{title}</h1>
      </div>
      <div className='print-pages'>
        {pages.map((page, pageIndex) => (
          <PrintablePage
            key={page.pageId}
            page={page}
            pageIndex={pageIndex}
            totalPages={pages.length}
            slotIndexMap={slotIndexMap}
            itemById={itemById}
            fontSize={fontSize}
            alignVertical={alignVertical}
            onImageLoaded={onImageLoaded}
            onImageErrored={onImageErrored}
          />
        ))}
      </div>
    </div>
  )
}
