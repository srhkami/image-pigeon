import {CustomImage} from "../utils/type.ts";
import ModalOutput from "@/features/Output/ModalOutput.tsx";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@/component";
import toast from "react-hot-toast";
import {MdDeleteForever} from "react-icons/md";

type Props = {
  readonly images: CustomImage[],
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly isMoveMode: boolean,
  readonly setIsMoveMode: Dispatch<SetStateAction<boolean>>,
}

/* 底端欄 */
export default function Footer({images, setImages, isMoveMode, setIsMoveMode}: Props) {

  const onClear = () => {
    toast(t => (
      <div className='w-52'>
        <div className='font-bold'>是否清除全部圖片？</div>
        <div className='text-sm text-error text-start'>此操作無法復原</div>
        <div className='flex justify-between mt-2'>
          <button className='btn btn-sm btn-success' onClick={() => {
            toast.dismiss(t.id);
            setImages([]);
          }}>
            確定
          </button>
          <button className='btn btn-sm ml-2' onClick={() => toast.dismiss(t.id)}>取消
          </button>
        </div>
      </div>
    ))
  }

  return (
    <div
      className='fixed bottom-1 right-1 rounded-lg p-4 border-1 border-base-300 bg-base-100/30 backdrop-blur-lg flex flex-col items-center gap-3'>
      <div className='text-sm'>共 {images.length} 張圖片</div>
      <Button color='error' size='sm' style='outline' className='w-full'
              onClick={onClear}>
        <MdDeleteForever/>全部清除
      </Button>
      <Button color='accent' size='sm' style={isMoveMode ? undefined : 'outline'} className='w-full'
              onClick={() => {
                setIsMoveMode(p => !p)
              }}>
        排序模式：{isMoveMode ? '開' : '關'}
      </Button>
      <div className='divider m-0'></div>
      <ModalOutput images={images}/>
    </div>
  )
}