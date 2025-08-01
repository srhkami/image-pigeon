import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "../../utils/type.ts";
import toast from "react-hot-toast";
import {Button} from "@/component";

type TFormValue = {
  image: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly setIsModalShow: (value: boolean) => void,
  readonly setIsLoading: (value: boolean) => void,
}

/* 新增多張圖片 */
export default function UploadMultiple({setImages, defaultRemark, setIsModalShow, setIsLoading}: Props) {

  const {register, handleSubmit, reset} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    toast.promise(
      async () => {
        setIsLoading(true);
        // 將每個檔案轉換成 CustomImage 並初始化（包含 base64、尺寸）
        const files = Array.from(formData.image);
        const imageInstances = files.map(file => new CustomImage(file, defaultRemark));
        const readyImages = await Promise.all(imageInstances.map(img => img.init()));
        // 更新圖片狀態
        setImages(prev => [...prev, ...readyImages]);
        setIsLoading(false);
        reset();
        setIsModalShow(false);
      }, {
        loading: '處理中...',
        success: '新增成功',
        error: '處理失敗',
      })
      .catch(err => console.log(err))
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <div className='flex flex-col'>
        <div className='mx-auto'>
          <fieldset className="fieldset">
            <label htmlFor='id_image' className='fieldset-legend'>上傳多張圖片：</label>
            <input id='id_image' type="file"
                   multiple accept=".jpg,.jpeg,.png,.jfif,.bmp" className="file-input"
                   {...register('image')}/>
          </fieldset>
        </div>
        <div className='mx-auto mt-2'>
          <Button color='primary'>
            新增
          </Button>
        </div>
      </div>
    </form>
  )
}