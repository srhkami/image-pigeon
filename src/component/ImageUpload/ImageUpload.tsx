import ImageForm from "./ImageForm.tsx";
import {useState} from "react";
import {CustomImage, TDefault} from "../../utils/type.ts";
import InfoForm from "../InfoForm.tsx";

export default function ImageUpload() {

  const [defaultInfo, setDefaultInfo] = useState<TDefault>({title: '預設標題', remark: '無', time: '無'});
  const [images, setImages] = useState<Array<CustomImage>>([]);

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      // 釋放 memory
      URL.revokeObjectURL(prev[index].preview);
      // 移除該圖
      return prev.filter((_, i) => i !== index);
    });
  };

  const imageList = images.map((img, index) => (

    <div key={index} className="card bg-base-100 w-96 shadow-sm">
      <figure>
        <img
          src={img.preview}
          alt={img.remark}
        />
      </figure>
      <div className="card-body">
        <h3>編號{index}</h3>
        <h2 className="card-title">{img.remark}</h2>
        <p>{img.time}</p>
        <div className="card-actions justify-end">
          <button className='btn btn-primary' onClick={() => handleRemoveImage(index)}>
            刪除
          </button>
        </div>
      </div>
    </div>
  ))

  return (
    <div>
      <InfoForm setDefaultInfo={setDefaultInfo}/>
      <ImageForm setImages={setImages} defaultInfo={defaultInfo}/>
      <div>
        現在有{images.length}個檔案
      </div>
      <div>
        {imageList}
      </div>
    </div>
  )
}