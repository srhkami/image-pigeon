import {SubmitHandler, useForm} from "react-hook-form";
import {useState} from "react";

type Props ={
  setImages:
}

type TFormValue = {
  image: ImageData[],
}

export default function ImageForm({setImages}) {


  const {register, handleSubmit} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    const files = Array.from(formData.image);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
    // setImages(formData.image)
  }



  return (
      <form onSubmit={handleSubmit(omSubmit)}>
        <div>
          <fieldset className="fieldset">
            <label htmlFor='id_image' className='fieldset-legend'>上傳圖片：</label>
            <br/>
            <input id='id_image' type="file" multiple accept="image/*" className="file-input"
                   {...register('image')}/>
          </fieldset>
        </div>
        <button className='btn btn-primary'>送出</button>
      </form>
  )
}