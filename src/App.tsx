import './App.css'
import {Toaster} from 'react-hot-toast'
import {DragEvent, useEffect, useRef, useState} from 'react'
import {CustomImage} from './utils/type.ts'
import {
  applyBatchLayoutPreference,
  applyBatchRotation,
  createEmptyProject,
  getOrderedItemViewModels,
  removeItems,
} from './state/projectState.ts'
import {Nav} from '@/layout'
import {ImagePreview} from '@/features'
import {PrintPreviewView} from '@/features/PrintPreview'
import {PrintPreviewOptions} from '@/features/PrintPreview/printLayout.ts'
import Sidebar from '@/layout/Sidebar.tsx'
import toast from 'react-hot-toast'
import ExternalImageDropOverlay from '@/features/Upload/ExternalImageDropOverlay.tsx'
import {isExternalFileDrag, partitionSupportedImageFiles, updateDragDepth} from '@/features/Upload/externalImageDrop.ts'
import {SUPPORTED_IMAGE_FILE_EXTENSIONS} from '@/features/Upload/fileAccept.ts'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {browserImportOperationCoordinator, browserProjectOperationCoordinator} from '@/services/browserProjectOperation.ts'
import {getActiveItemIdAfterRemovingItems} from '@/features/ImagePreview/wheelNavigation.ts'

const DEFAULT_PRINT_OPTIONS: PrintPreviewOptions = {title: '照片黏貼表', fontSize: '18', alignVertical: 'center'}

function App() {
  const [, setImages] = useState<Array<CustomImage>>([])
  const [isMoveMode, setIsMoveMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set())
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [project, setProject] = useState(createEmptyProject())
  const [sessionId, setSessionId] = useState<string | null>(null)
  const projectRef = useRef(project)
  const sessionIdRef = useRef(sessionId)
  const projectSessionSequenceRef = useRef(0)
  const [viewMode, setViewMode] = useState<'editor' | 'print-preview'>('editor')
  const [printOptions, setPrintOptions] = useState<PrintPreviewOptions>(DEFAULT_PRINT_OPTIONS)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [pendingImportFiles, setPendingImportFiles] = useState<File[]>([])
  const [dragDepth, setDragDepth] = useState(0)

  projectRef.current = project
  sessionIdRef.current = sessionId

  useEffect(() => () => {
    browserImportOperationCoordinator.cancel()
    browserProjectOperationCoordinator.cancel()
    browserAssetStore.clear()
  }, [])

  useEffect(() => {
    if (!isMoveMode) setSelectedItemIds(new Set())
  }, [isMoveMode])

  useEffect(() => {
    setSelectedItemIds(new Set())
    setActiveItemId(null)
  }, [sessionId])

  useEffect(() => {
    const itemIds = new Set(project.items.map((item) => item.id))
    setSelectedItemIds((current) => {
      const next = new Set([...current].filter((itemId) => itemIds.has(itemId)))
      return next.size === current.size ? current : next
    })
  }, [project.items])

  const previewItems = getOrderedItemViewModels(project, sessionId ?? '')
  const projectItemCount = previewItems.length

  useEffect(() => {
    if (!previewItems.length) {
      setActiveItemId(null)
      return
    }
    if (activeItemId && previewItems.some((item) => item.itemId === activeItemId)) return
    setActiveItemId(previewItems[0]?.itemId ?? null)
  }, [activeItemId, previewItems])

  const toggleSelectedItem = (itemId: string) => {
    setSelectedItemIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }
  const removeSelectedItems = (
    itemIds: ReadonlySet<string>,
    expectedSessionId: string | null = sessionIdRef.current,
  ) => {
    if (!itemIds.size) return
    if (sessionIdRef.current !== expectedSessionId) {
      toast.error('專案已切換，原本的刪除確認已失效')
      return
    }
    const currentProject = projectRef.current
    const currentPreviewItems = getOrderedItemViewModels(currentProject, expectedSessionId ?? '')
    setActiveItemId((current) => getActiveItemIdAfterRemovingItems(
      currentPreviewItems.map((item) => item.itemId),
      current,
      itemIds,
    ))
    const nextProject = removeItems(currentProject, itemIds)
    const nextAssetIds = new Set(nextProject.assets.map((asset) => asset.id))
    for (const asset of currentProject.assets) {
      if (!nextAssetIds.has(asset.id)) browserAssetStore.delete(asset.id)
    }
    projectRef.current = nextProject
    setProject(nextProject)
    setImages((current) => current.filter((image) => !itemIds.has(image.id)))
    setSelectedItemIds((current) => new Set([...current].filter((itemId) => !itemIds.has(itemId))))
  }
  const batchRotate = (offset: 90 | -90) => {
    if (!selectedItemIds.size) return
    setProject((current) => applyBatchRotation(current, selectedItemIds, offset))
    setImages((current) => current.map((image) => {
      if (selectedItemIds.has(image.id)) image.setRotation(((image.rotation + offset) % 360 + 360) % 360 as 0 | 90 | 180 | 270)
      return image
    }))
    toast.success(`已將 ${selectedItemIds.size} 張圖片${offset < 0 ? '向左' : '向右'}轉 90°`)
  }
  const batchLayout = (layout: 'stacked-2' | 'side-by-side-2' | 'grid-6') => {
    if (!selectedItemIds.size) return
    setProject((current) => applyBatchLayoutPreference(current, selectedItemIds, layout))
    toast.success(`已套用 ${selectedItemIds.size} 張圖片的排版`)
  }
  const startProjectSession = () => {
    const nextSessionId = `project-${++projectSessionSequenceRef.current}`
    sessionIdRef.current = nextSessionId
    setSessionId(nextSessionId)
    setSelectedItemIds(new Set())
    setActiveItemId(null)
  }

  const onOpenImport = (files: File[] = []) => {
    setPendingImportFiles(files)
    setIsImportModalOpen(true)
  }
  const onCloseImport = () => {
    setIsImportModalOpen(false)
    setPendingImportFiles([])
  }
  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault(); setDragDepth((current) => updateDragDepth(current, 1))
  }
  const onDragOver = (event: DragEvent<HTMLDivElement>) => { if (isExternalFileDrag(event.dataTransfer.types)) event.preventDefault() }
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault(); setDragDepth((current) => updateDragDepth(current, -1))
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault(); setDragDepth(0)
    const {accepted, rejected} = partitionSupportedImageFiles(Array.from(event.dataTransfer.files), SUPPORTED_IMAGE_FILE_EXTENSIONS)
    if (rejected.length) toast.error(`已略過 ${rejected.length} 個不支援的檔案`)
    if (!accepted.length) { toast.error('請拖入支援的圖片檔案'); return }
    onOpenImport(accepted)
  }

  if (viewMode === 'print-preview') {
    return <><PrintPreviewView project={project} title={printOptions.title} fontSize={printOptions.fontSize} alignVertical={printOptions.alignVertical} onBackToEditor={() => setViewMode('editor')}/><Toaster position='top-center' reverseOrder={false}/></>
  }

  return (
    <div className='h-dvh overflow-hidden flex flex-col' onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <Nav/>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <Sidebar setImages={setImages} itemCount={projectItemCount} project={project} setProject={setProject} sessionId={sessionId} onProjectOpened={startProjectSession}
          isMoveMode={isMoveMode} setIsMoveMode={setIsMoveMode} selectedItemIds={selectedItemIds}
          onSelectAll={() => setSelectedItemIds(new Set(project.items.map((item) => item.id)))} onClearSelection={() => setSelectedItemIds(new Set())}
          onBatchRotate={batchRotate} onBatchLayout={batchLayout} onRemoveSelected={removeSelectedItems}
          onPrintPreview={(options) => { setPrintOptions(options); setViewMode('print-preview') }} isImportModalOpen={isImportModalOpen}
          pendingImportFiles={pendingImportFiles} onOpenImport={() => onOpenImport()} onCloseImport={onCloseImport}/>
        <main className='min-w-0 flex-1 overflow-hidden'>
          <ImagePreview project={project} setProject={setProject} sessionId={sessionId} setImages={setImages} isMoveMode={isMoveMode}
            activeItemId={activeItemId} setActiveItemId={setActiveItemId} selectedItemIds={selectedItemIds}
            onToggleSelectedItem={toggleSelectedItem} onRemoveItems={removeSelectedItems}/>
        </main>
      </div>
      {dragDepth > 0 && <ExternalImageDropOverlay/>}
      <Toaster position='top-center' reverseOrder={false}/>
    </div>
  )
}

export default App
