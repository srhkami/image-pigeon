import {SubmitHandler, useForm} from "react-hook-form";
import ImageForm from "../ImageForm.tsx";

export default function ImageUpload() {

  const [images, setImages] = useState([]);

  const handleRemoveImage = (index:number) => {
    setImages(prev => {
      // 釋放 memory
      URL.revokeObjectURL(prev[index].preview);
      // 移除該圖
      return prev.filter((_, i) => i !== index);
    });
  };

  const imageList = images.map((img, index) => (
    <div key={index}>
      <img
        src={img.preview}
        alt={`preview-${index}`}
        style={{width: 100, height: 100, objectFit: 'cover', marginRight: 10}}
      />
      <button className='btn btn-primary'
              onClick={() => handleRemoveImage(index)}> 刪除
      </button>
    </div>
  ))

  return (
    <div>
      <ImageForm setImages={setImages}/>
      <div>
        現在有{images.length}個檔案
      </div>
      <div>
        {imageList}
      </div>
    </div>
  )
}