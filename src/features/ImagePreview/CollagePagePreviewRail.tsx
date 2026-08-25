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

  // if (!pages.length) {
  //   return null
  // }

  return (
    <aside className='m-3 p-4 w-50 rounded-lg border border-base-300 bg-base-100/70 min-h-0'>
      {/*<div className='card card-compact bg-base-100 border border-base-300/50 h-full'>*/}

          <h3 className='card-title  flex justify-center items-center'>排版預覽</h3>
          <div className='divider my-0 mb-1'></div>
          <div className='h-full flex-1 overflow-y-auto pr-1 space-y-3'>
            {!pages.length &&
            <div className='h-full flex justify-center items-center'>
                <h1 className='text-xl opacity-50 text-center'>圖片排版 <br/>會顯示在此</h1>
            </div>
            }

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
      {/*</div>*/}
    </aside>
  )
}
