import {CustomImage} from "../utils/type.ts";
import ModalOutput from "@/features/Output/ModalOutput.tsx";
import ModalUpload from "@/features/Upload/ModalUpload.tsx";
import {Dispatch, SetStateAction} from "react";
import {Button} from "@/component";
import toast from "react-hot-toast";

type Props = {
  readonly images: CustomImage[],
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
}

/* 底端欄 */
export default function Footer({images, setImages}: Props) {

  const onClear = ()=>{
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
    <div className='sticky bottom-0 border-t-1 border-base-300 flex justify-between items-center py-2 px-2 z-20 bg-base-100/30 backdrop-blur-lg'>
      <ModalUpload setImages={setImages}/>
      {/*<ModalReadJson>*/}
      {/*<button className='btn btn-sm btn-primary mx-2' onClick={handleUploadModalShow}>新增圖片</button>*/}
      {images.length !== 0 &&
      <div className='my-auto text-sm flex flex-col justify-around'>
        <div>共有 {images.length} 張圖片 </div>
          <Button color='error' style='link' size='sm' className='text-error p-0'
                   onClick={onClear}>
            全部清除
          </Button>
      </div>
    }
      <ModalOutput images={images}/>
    </div>
  )
}