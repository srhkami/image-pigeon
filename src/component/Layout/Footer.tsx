/* 底端欄 */
import {CustomImage} from "../../utils/type.ts";

type Props = {
  readonly images: CustomImage[],
  readonly handleUploadModalShow: () => void,
  readonly handleOutputModalShow: () => void,
}


export default function Footer({images, handleUploadModalShow, handleOutputModalShow}: Props) {



  return (
    <div className='sticky bottom-0 bg-base-100 border-t-2 flex py-2 z-50'>
      <button className='btn btn-sm btn-primary mx-2' onClick={handleUploadModalShow}>新增圖片</button>
      <div className='ml-2 my-auto'>
        共有 {images.length} 張圖片
      </div>
      <button className='btn btn-sm btn-success mx-2 ml-auto' onClick={handleOutputModalShow}>輸出檔案</button>
    </div>
  )
}