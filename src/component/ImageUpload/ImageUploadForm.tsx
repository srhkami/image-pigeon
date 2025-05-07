import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage, TDefault} from "../../utils/type.ts";

type TFormValue = {
  image: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultInfo: TDefault,
}

export default function ImageUploadForm({setImages, defaultInfo}: Props) {


  const {register, handleSubmit, reset} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    // 取得檔案列表
    const files = Array.from(formData.image);
    // 將每個檔案轉換成自定義的圖片物件
    const newImages: CustomImage[] = files.map(file => new CustomImage(file, defaultInfo.remark));
    // 將新上傳的圖片加入現有state列表
    setImages(prev => [...prev, ...newImages]);
    reset();
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