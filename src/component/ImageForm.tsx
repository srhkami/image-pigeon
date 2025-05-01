import {SubmitHandler, useForm} from "react-hook-form";
import {useState} from "react";

type TFormValue = {
  image: ImageData[],
}

export default function ImageForm() {

  const [images, setImages] = useState<ImageData[]>([]);

  const {register, handleSubmit} = useForm<TFormValue>();

  const omSubmit: SubmitHandler<TFormValue> = (formData) => {
    // console.log(formData);
    const files = formData.image;
    const newImages: ImageData[] = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          name: file.name,
          base64: reader.result as string
        });
        if (newImages.length === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    // setImages(formData.image)
  }

  const imageList = images.map((image, index)=>{
    <div key={index} style={{ border: '1px solid #ccc', padding: 10 }}>
      <img src={image.base64} alt={image.name} width={100} />
      <div>{image.name}</div>
    </div>
  })

  return (
    <div>
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
      <div>
        {imageList}
      </div>
    </div>
  )
}