/* 底端欄 */
import toast from "react-hot-toast";
import {CustomImage, TDefault} from "../../utils/type.ts";

type Props = {
  images: CustomImage[],
  defaultInfo: TDefault,
  handleUploadModalClose: () => void,
}


export default function Footer({images, defaultInfo, handleUploadModalClose}: Props) {

  const handleSaveDocx = () => {
    const data = {
      title: defaultInfo.title,
      images: images,
    }
    window.pywebview.api.save_docx(data)
      .then(res => {
        console.log(res);
        if (res.status == 200) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      })
  }

  return (
    <div className='sticky bottom-0 bg-base-100 border-t-2 flex py-2 z-0'>
      <button className='btn btn-sm btn-primary mx-2' onClick={handleUploadModalClose}>新增圖片</button>
      <div className='ml-2 my-auto'>
        共有 {images.length} 張圖片
      </div>
      <button className='btn btn-sm mx-2 ml-auto'>列印</button>
      <button className='btn btn-sm btn-success mx-2' onClick={handleSaveDocx}>儲存Word檔</button>
    </div>
  )
}