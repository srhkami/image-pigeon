import ModalOutput from "@/features/Output/ModalOutput.tsx";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@/component";
import toast from "react-hot-toast";
import {MdDeleteForever} from "react-icons/md";
import {ProjectV2} from '@/types/project.ts'
import {CustomImage} from '@/utils/type.ts'

type Props = {
    readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
    readonly itemCount: number,
    readonly project: ProjectV2,
    readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
    readonly sessionId: string | null,
    readonly onClearProject: () => void,
    readonly isMoveMode: boolean,
    readonly setIsMoveMode: Dispatch<SetStateAction<boolean>>,
}

/* 底端欄 */
export default function Footer({
  setImages,
  itemCount,
  project,
  setProject,
  sessionId,
  onClearProject,
  isMoveMode,
  setIsMoveMode,
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
    <div
      className='fixed bottom-1 right-1 rounded-lg p-4 border-1 border-base-300 bg-base-100/30 backdrop-blur-lg flex flex-col items-center gap-3'>
       <div className='text-sm'>共 {itemCount} 張圖片</div>
      <Button color='error' size='sm' style='outline' className='w-full'
              onClick={onClear}>
        <MdDeleteForever/>全部清除
      </Button>
       <Button color='info' size='sm' style={isMoveMode ? undefined : 'outline'} className='w-full'
              onClick={() => {
                setIsMoveMode(p => !p)
              }}>
        排序模式：{isMoveMode ? '開' : '關'}
      </Button>
      <div className='divider m-0'></div>
       <ModalOutput
         project={project}
         setProject={setProject}
         sessionId={sessionId}
         itemCount={itemCount}
       />
    </div>
  )
}
