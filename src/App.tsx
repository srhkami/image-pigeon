import './App.css'
import {Toaster} from "react-hot-toast";
import {DragEvent, useEffect, useState} from "react";
import {CustomImage} from "./utils/type.ts";
import {clearProjectItems, createEmptyProject, getOrderedItemViewModels} from "./state/projectState.ts";
import {Nav} from "@/layout";
import {ImagePreview, Intro} from "@/features";
import {PrintPreviewView} from "@/features/PrintPreview";
import {PrintPreviewOptions} from "@/features/PrintPreview/printLayout.ts";
import Sidebar from "@/layout/Sidebar.tsx";
import toast from "react-hot-toast";
import ExternalImageDropOverlay from "@/features/Upload/ExternalImageDropOverlay.tsx";
import {
  isExternalFileDrag,
  partitionSupportedImageFiles,
  updateDragDepth,
} from "@/features/Upload/externalImageDrop.ts";
import {SUPPORTED_IMAGE_FILE_EXTENSIONS} from "@/features/Upload/fileAccept.ts";
import {browserAssetStore} from "@/services/browserAssetStore.ts";
import {
  browserImportOperationCoordinator,
  browserProjectOperationCoordinator,
} from "@/services/browserProjectOperation.ts";

const DEFAULT_PRINT_OPTIONS: PrintPreviewOptions = {
  title: '照片黏貼表',
  fontSize: '18',
  alignVertical: 'center',
}

function App() {

  const [, setImages] = useState<Array<CustomImage>>([]);
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false); // 排序模式
  const [project, setProject] = useState(createEmptyProject());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'print-preview'>('editor');
  const [printOptions, setPrintOptions] = useState<PrintPreviewOptions>(DEFAULT_PRINT_OPTIONS);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [pendingImportFiles, setPendingImportFiles] = useState<File[]>([])
  const [dragDepth, setDragDepth] = useState(0)

  useEffect(() => () => {
    browserImportOperationCoordinator.cancel()
    browserProjectOperationCoordinator.cancel()
    browserAssetStore.clear()
  }, [])

  const previewItems = getOrderedItemViewModels(project, sessionId ?? "")
  const projectItemCount = previewItems.length

  const onBackToEditor = () => {
    setViewMode('editor');
  }

  const onEnterPrintPreview = (options: PrintPreviewOptions) => {
    setPrintOptions(options)
    setViewMode('print-preview');
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
    event.preventDefault()
    setDragDepth(currentDepth => updateDragDepth(currentDepth, 1))
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault()
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault()
    setDragDepth(currentDepth => updateDragDepth(currentDepth, -1))
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isExternalFileDrag(event.dataTransfer.types)) return
    event.preventDefault()
    setDragDepth(0)

    const {accepted, rejected} = partitionSupportedImageFiles(
      Array.from(event.dataTransfer.files),
      SUPPORTED_IMAGE_FILE_EXTENSIONS,
    )

    if (rejected.length) {
      toast.error(`已略過 ${rejected.length} 個不支援的檔案`)
    }
    if (!accepted.length) {
      toast.error('請拖入支援的圖片檔案')
      return
    }

    onOpenImport(accepted)
  }

  if (viewMode === 'print-preview') {
    return (
      <>
        <PrintPreviewView
          project={project}
          title={printOptions.title}
          fontSize={printOptions.fontSize}
          alignVertical={printOptions.alignVertical}
          onBackToEditor={onBackToEditor}
        />
        <Toaster
          position="top-center"
          reverseOrder={false}
        />
      </>
    )
  }

  return (
    <div className='h-dvh overflow-hidden flex flex-col'
         onDragEnter={onDragEnter}
         onDragOver={onDragOver}
         onDragLeave={onDragLeave}
         onDrop={onDrop}>
      <Nav/>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <Sidebar
          setImages={setImages}
          itemCount={projectItemCount}
          project={project}
          setProject={setProject}
          sessionId={sessionId}
          setSessionId={setSessionId}
          onClearProject={() => {
            browserImportOperationCoordinator.cancel()
            browserProjectOperationCoordinator.cancel()
            browserAssetStore.clear()
            setProject(clearProjectItems)
          }}
          isMoveMode={isMoveMode}
          setIsMoveMode={setIsMoveMode}
          onPrintPreview={onEnterPrintPreview}
          isImportModalOpen={isImportModalOpen}
          pendingImportFiles={pendingImportFiles}
          onOpenImport={() => onOpenImport()}
          onCloseImport={onCloseImport}
        />
        <main className='min-w-0 flex-1 overflow-hidden'>
          {!projectItemCount ? (
            <Intro/>
          ) : (
            <ImagePreview
              project={project}
              setProject={setProject}
              sessionId={sessionId}
              setImages={setImages}
              isMoveMode={isMoveMode}
            />
          )}
        </main>
      </div>

      {dragDepth > 0 && <ExternalImageDropOverlay/>}
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
