import ModalOutput from '@/features/Output/ModalOutput.tsx'
import {Dispatch, SetStateAction} from 'react'
import {Button} from '@/component'
import toast from 'react-hot-toast'
import {FaArrowRotateLeft, FaArrowRotateRight} from 'react-icons/fa6'
import {MdDeleteForever} from 'react-icons/md'
import {ProjectV2} from '@/types/project.ts'
import {CustomImage} from '@/utils/type.ts'
import OpenProject from '../features/Upload/OpenProject.tsx'
import ModalImport from '@/features/Upload/ModalImport.tsx'
import {PrintPreviewOptions} from '@/features/PrintPreview/printLayout.ts'
import {LuImageUp, LuListOrdered} from 'react-icons/lu'
import {FaEdit} from "react-icons/fa";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
  readonly itemCount: number
  readonly project: ProjectV2
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly sessionId: string | null
  readonly onProjectOpened: () => void
  readonly isMoveMode: boolean
  readonly setIsMoveMode: Dispatch<SetStateAction<boolean>>
  readonly selectedItemIds: ReadonlySet<string>
  readonly onSelectAll: () => void
  readonly onClearSelection: () => void
  readonly onBatchRotate: (offset: 90 | -90) => void
  readonly onBatchLayout: (layout: 'stacked-2' | 'side-by-side-2' | 'grid-6') => void
  readonly onRemoveSelected: (itemIds: ReadonlySet<string>, expectedSessionId: string | null) => void
  readonly onPrintPreview: (options: PrintPreviewOptions) => void
  readonly isImportModalOpen: boolean
  readonly pendingImportFiles: File[]
  readonly onOpenImport: () => void
  readonly onCloseImport: () => void
}

export default function Sidebar({
                                  setImages,
                                  itemCount,
                                  project,
                                  setProject,
                                  sessionId,
                                  onProjectOpened,
                                  isMoveMode,
                                  setIsMoveMode,
                                  selectedItemIds,
                                  onSelectAll,
                                  onClearSelection,
                                  onBatchRotate,
                                  onBatchLayout,
                                  onRemoveSelected,
                                  onPrintPreview,
                                  isImportModalOpen,
                                  pendingImportFiles,
                                  onOpenImport,
                                  onCloseImport,
                                }: Props) {
  const hasSelection = selectedItemIds.size > 0
  const confirmRemoveSelected = () => {
    const allSelected = selectedItemIds.size === itemCount
    const confirmedSessionId = sessionId
    const confirmedItemIds = new Set(selectedItemIds)
    toast((t) => (
      <div className='w-56'>
        <div
          className='font-bold'>是否刪除{allSelected ? `全部 ${itemCount} 張` : `已選取的 ${selectedItemIds.size} 張`}圖片？
        </div>
        <div className='text-sm text-error text-start'>此操作無法復原</div>
        <div className='flex justify-end mt-2'>
          <Button size='sm' color='error' onClick={() => {
            toast.dismiss(t.id);
            onRemoveSelected(confirmedItemIds, confirmedSessionId)
          }}>確定</Button>
          <Button size='sm' className='ml-2' onClick={() => toast.dismiss(t.id)}>取消</Button>
        </div>
      </div>
    ))
  }

  return (
    <aside
      className='m-3 flex h-[calc(100%-1.5rem)] w-50 shrink-0 flex-col items-stretch gap-3 overflow-y-auto overscroll-contain rounded-lg border border-base-300 bg-base-100/70 p-4 backdrop-blur-lg'>
      <Button color='primary' onClick={onOpenImport}><LuImageUp/>導入圖片</Button>
      <ModalImport setImages={setImages} setProject={setProject} isShow={isImportModalOpen}
                   pendingFiles={pendingImportFiles} onHide={onCloseImport}/>
      <OpenProject setProject={setProject} setSessionId={() => onProjectOpened()} setImages={setImages}
                   itemCount={project.items.length}/>
      <div className='divider m-0'/>
      <Button color='info'
              disabled={!isMoveMode}
              onClick={() => setIsMoveMode((current) => !current)}>
        <FaEdit /> 編輯模式
      </Button>
      <Button color='info'
              disabled={isMoveMode}
              onClick={() => setIsMoveMode((current) => !current)}>
        <LuListOrdered /> 整理模式
      </Button>
      {isMoveMode && <>
          <div className='divider m-0'/>
          <div className='text-sm text-center'>已選取 {selectedItemIds.size} / {itemCount} 張</div>
          <div className='grid grid-cols-2 gap-2'>
              <button type='button' className='btn btn-sm btn-warning' onClick={onSelectAll}
                      disabled={itemCount === 0 || selectedItemIds.size === itemCount}>全選
              </button>
              <button type='button' className='btn btn-sm btn-warning btn-outline' onClick={onClearSelection}
                      disabled={!hasSelection}>取消選取
              </button>
          </div>
          <div className='grid grid-cols-2 gap-1'>
              <button type='button' className='btn btn-sm' onClick={() => onBatchRotate(-90)} disabled={!hasSelection}>
                  <FaArrowRotateLeft/>左轉
              </button>
              <button type='button' className='btn btn-sm' onClick={() => onBatchRotate(90)} disabled={!hasSelection}>
                  <FaArrowRotateRight/>右轉
              </button>
          </div>
          <div className='grid grid-cols-3 gap-1'>
              <button type='button' className='btn btn-sm' onClick={() => onBatchLayout('stacked-2')}
                      disabled={!hasSelection}>上下
              </button>
              <button type='button' className='btn btn-sm' onClick={() => onBatchLayout('side-by-side-2')}
                      disabled={!hasSelection}>左右
              </button>
              <button type='button' className='btn btn-sm' onClick={() => onBatchLayout('grid-6')}
                      disabled={!hasSelection}>六張
              </button>
          </div>
          <button type='button' className='btn btn-sm btn-error' disabled={!hasSelection}
                  onClick={confirmRemoveSelected}>
              <MdDeleteForever/>刪除已選圖片
          </button>
      </>}
      <div className='divider m-0 mt-auto'/>
      <div className='text-sm text-center'>共 {itemCount} 張圖片</div>
      <ModalOutput project={project} setProject={setProject} itemCount={itemCount}
                   onEnterPrintPreview={onPrintPreview}/>
    </aside>
  )
}
