import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "../../utils/type.ts";
import toast from "react-hot-toast";
import {checkStatus} from "../../utils/handleError.ts";

type TFormValue = {
  image: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly setIsModalShow: (value: boolean) => void,
  readonly setIsLoading: (value: boolean) => void,
}

/* 新增長截圖，並傳至後端自動分割，之後提供預覽 */
export default function UploadLongScreen({setImages, defaultRemark, setIsModalShow, setIsLoading}: Props) {

  const {register, handleSubmit, reset} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    toast.promise(
      async () => {
        try {
          setIsLoading(true);
          // toast.loading('處理中，請稍候...')
          // 將圖片轉化為自訂物件
          const image = new CustomImage(formData.image[0], defaultRemark)
          // 等待 base64 等欄位初始化完成
          const readyImage = await image.init();
          // 將初始化完成的圖片傳給後端
          const res = await window.pywebview.api.crop_image(readyImage);
          // 後端處理完成，將base64列表重新轉化為自訂物件
          checkStatus(res);
          const imageObjs = await Promise.all(
            res.data.map((imgData: {
              base64: string,
              width: number,
              height: number,
            }) => CustomImage.fromBase64(imgData, defaultRemark))
          );
          // 更新圖片狀態
          setImages(prev => [...prev, ...imageObjs]);
          setIsLoading(false);
          reset();
          setIsModalShow(false);
        } catch (error) {
          setIsLoading(false);
          throw error
        }
      }, {
        loading: '處理中...',
        success: '新增成功',
        error: (err) => err.toString(),
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <div className='flex flex-col'>
        <div className='mx-auto'>
          <fieldset className="fieldset">
            <label htmlFor='id_image' className='fieldset-legend'>上傳長截圖：</label>
            <input id='id_image' type="file" accept=".jpg,.jpeg,.png" className="file-input file-input-sm"
                   {...register('image')}/>
          </fieldset>
        </div>
        <div className='mx-auto'>
          <button className='btn btn-primary btn-sm'>新增</button>
        </div>
      </div>
    </form>
  )
}