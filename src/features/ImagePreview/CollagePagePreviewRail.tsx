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
    return null
  }

  return (
    <aside className='w-full min-h-0 lg:w-[24%] xl:w-[22%]'>
      <div className='card card-compact bg-base-100 border border-base-300/50 h-full'>
        <div className='card-body min-h-0 p-3'>
          <h3 className='card-title  flex justify-center items-center'>排版預覽</h3>
          <div className='divider my-0 mb-1'></div>
          <div className='min-h-0 flex-1 overflow-y-auto pr-1 space-y-3'>
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
