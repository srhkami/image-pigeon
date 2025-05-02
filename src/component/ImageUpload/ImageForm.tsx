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

export default function ImageForm({setImages, defaultInfo}: Props) {


  const {register, handleSubmit} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    // 取得檔案列表
    const files = Array.from(formData.image);
    // 將每個檔案轉換成自定義的圖片物件
    const newImages: CustomImage[] = files.map(file => new CustomImage(file, defaultInfo.remark, defaultInfo.time));
    // 將新上傳的圖片加入現有state列表
    setImages(prev => [...prev, ...newImages]);
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <div>
        <fieldset className="fieldset">
          <label htmlFor='id_image' className='fieldset-legend'>上傳圖片：</label>
          <br/>
          <input id='id_image' type="file"
                 multiple accept="image/*" className="file-input"
                 {...register('image')}/>
        </fieldset>
      </div>
      <button className='btn btn-primary'>新增</button>
    </form>
  )
}