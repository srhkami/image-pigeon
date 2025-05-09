import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "../../utils/type.ts";
import toast from "react-hot-toast";

type TFormValue = {
  image: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly setIsModalShow: (value: boolean) => void,
}

/* 新增多張圖片 */
export default function UploadMultiple({setImages, defaultRemark, setIsModalShow}: Props) {

  const {register, handleSubmit, reset} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    (async () => {
      // 將每個檔案轉換成 CustomImage 並初始化（包含 base64、尺寸）
      const files = Array.from(formData.image);
      const imageInstances = files.map(file => new CustomImage(file, defaultRemark));
      const readyImages = await Promise.all(imageInstances.map(img => img.init()));

      // 更新圖片狀態
      setImages(prev => [...prev, ...readyImages]);
      toast.success('新增成功');
      reset();
      setIsModalShow(false);
    })();
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <div className='flex flex-col'>
        <div className='mx-auto'>
          <fieldset className="fieldset">
            <label htmlFor='id_image' className='fieldset-legend'>上傳多張圖片：</label>
            <input id='id_image' type="file"
                   multiple accept="image/*" className="file-input file-input-sm"
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