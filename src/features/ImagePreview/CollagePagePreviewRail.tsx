import {Dispatch, SetStateAction, useEffect, useRef} from 'react'
import {ProjectItemViewModel} from '@/types/project.ts'
import {AutoCollagePage} from '@/features/ImagePreview/autoCollageLayout.ts'
import CollagePageThumbnail from '@/features/ImagePreview/CollagePageThumbnail.tsx'

type Props = {
  readonly pages: AutoCollagePage[]
  readonly viewModels: ProjectItemViewModel[]
  readonly activeItemId: string | null
  readonly activePageIndex: number
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>
}

export default function CollagePagePreviewRail({
  pages,
  viewModels,
  activeItemId,
  activePageIndex,
  setActiveItemId,
}: Props) {
  const pageRefMap = useRef<Record<string, HTMLButtonElement | null>>({})

  const itemById = (itemId: string): ProjectItemViewModel | undefined =>
    viewModels.find((item) => item.itemId === itemId)

  useEffect(() => {
    if (activePageIndex < 0) return
    const targetPage = pages[activePageIndex]
    const targetRef = targetPage ? pageRefMap.current[targetPage.pageId] : null
    if (!targetRef) return

    targetRef.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [activePageIndex, pages])

  if (!pages.length) {
    return (
      <aside className='w-full lg:w-[32%] min-h-0'>
        <div className='card card-compact bg-base-100 border border-base-300/50'>
          <div className='card-body'>
            <h3 className='font-semibold'>頁面縮圖預覽</h3>
            <p className='text-sm text-base-content/60'>尚無可預覽頁面，請先匯入圖片。</p>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className='w-full lg:w-[32%] min-h-0'>
      <div className='card card-compact bg-base-100 border border-base-300/50 h-full'>
        <div className='card-body p-3'>
          <h3 className='font-semibold'>頁面縮圖預覽</h3>
          <div className='divider my-1'></div>
          <div className='max-h-[72vh] overflow-y-auto pr-2 space-y-3'>
            {pages.map((page, pageIndex) => {
              const isActivePage = pageIndex === activePageIndex
              const firstItemId = page.slots.find((slot) => slot.itemId)?.itemId ?? null

              return (
                <CollagePageThumbnail
                  key={page.pageId}
                  page={page}
                  pageIndex={pageIndex}
                  isActivePage={isActivePage}
                  activeItemId={activeItemId}
                  itemById={(itemId) => itemById(itemId)}
                  pageRef={(el) => {
                    pageRefMap.current[page.pageId] = el
                  }}
                  onPageActivate={() => setActiveItemId(firstItemId)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
