import ModalOutput from "@/features/Output/ModalOutput.tsx";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@/component";
import toast from "react-hot-toast";
import {MdDeleteForever} from "react-icons/md";
import {ProjectV2} from '@/types/project.ts'
import {CustomImage} from '@/utils/type.ts'
import OpenProject from "../features/Upload/OpenProject.tsx";
import ModalImport from "@/features/Upload/ModalImport.tsx";
import {PrintPreviewOptions} from "@/features/PrintPreview/printLayout.ts";
import {LuImageUp} from "react-icons/lu";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly itemCount: number,
  readonly project: ProjectV2,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly sessionId: string | null,
  readonly setSessionId: Dispatch<SetStateAction<string | null>>,
  readonly onClearProject: () => void,
  readonly isMoveMode: boolean,
  readonly setIsMoveMode: Dispatch<SetStateAction<boolean>>,
  readonly onPrintPreview: (options: PrintPreviewOptions) => void,
  readonly isImportModalOpen: boolean,
  readonly pendingImportFiles: File[],
  readonly onOpenImport: () => void,
  readonly onCloseImport: () => void,
}

/* 左側操作欄 */
export default function Sidebar({
                                  setImages,
                                  itemCount,
                                  project,
                                  setProject,
                                  sessionId,
                                  setSessionId,
                                  onClearProject,
                                  isMoveMode,
                                  setIsMoveMode,
                                  onPrintPreview,
                                  isImportModalOpen,
                                  pendingImportFiles,
                                  onOpenImport,
                                  onCloseImport,
                                }: Props) {

  const onClear = () => {
    toast(t => (
      <div className='w-52'>
        <div className='font-bold'>是否清除全部圖片？</div>
        <div className='text-sm text-error text-start'>此操作無法復原</div>
        <div className='flex justify-end mt-2'>
          <Button size='sm' color='error' onClick={() => {
            toast.dismiss(t.id);
            onClearProject();
            setImages([]);
          }}>
            確定
          </Button>
          <Button size='sm' className='ml-2' onClick={() => toast.dismiss(t.id)}>
            取消
          </Button>
        </div>
      </div>
    ))
  }

  return (
    <aside
      className='m-3 flex h-[calc(100%-1.5rem)] w-48 shrink-0 flex-col items-stretch gap-3 overflow-y-auto overscroll-contain rounded-lg border border-base-300 bg-base-100/70 p-4 backdrop-blur-lg'>
      <Button color='primary' onClick={onOpenImport}>
        <LuImageUp/>
        導入圖片
      </Button>
      <ModalImport
        setImages={setImages}
        project={project}
        setProject={setProject}
        sessionId={sessionId}
        setSessionId={setSessionId}
        isShow={isImportModalOpen}
        pendingFiles={pendingImportFiles}
        onHide={onCloseImport}
      />
      <OpenProject
        setProject={setProject}
        setSessionId={setSessionId}
        setImages={setImages}
        itemCount={project.items.length}
      />
      <Button color='info' style={isMoveMode ? undefined : 'outline'} className='w-full'
              onClick={() => {
                setIsMoveMode(p => !p)
              }}>
        排序模式：{isMoveMode ? '開' : '關'}
      </Button>
      <div className='divider m-0'></div>

      <Button color='error' style='outline' className='w-full'
              onClick={onClear}>
        <MdDeleteForever/>全部清除
      </Button>

      <div className='divider m-0 mt-auto'></div>
      <div className='text-sm text-center'>共 {itemCount} 張圖片</div>
      <ModalOutput
        project={project}
        setProject={setProject}
        sessionId={sessionId}
        itemCount={itemCount}
        onEnterPrintPreview={onPrintPreview}
      />
    </aside>
  )
}
