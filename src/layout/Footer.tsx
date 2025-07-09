import {CustomImage} from "../utils/type.ts";
import ModalOutput from "@/features/ImageOutput/ModalOutput.tsx";
import ModalUpload from "@/features/ImageUpload/ModalUpload.tsx";
import {Dispatch, SetStateAction} from "react";

type Props = {
  readonly images: CustomImage[],
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
}

/* 底端欄 */
export default function Footer({images, setImages}: Props) {

  return (
    <div className='sticky bottom-0 border-t-1 border-base-300 flex justify-between py-2 px-2 z-20 bg-base-100/30 backdrop-blur-lg'>
      <ModalUpload setImages={setImages}/>
      {/*<button className='btn btn-sm btn-primary mx-2' onClick={handleUploadModalShow}>新增圖片</button>*/}
      <div className='my-auto text-sm'>
        共有 {images.length} 張圖片
      </div>
      <ModalOutput images={images}/>
    </div>
  )
}