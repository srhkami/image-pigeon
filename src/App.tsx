import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage, TDefault} from "./utils/type.ts";
import InfoForm from "./component/InfoForm/InfoForm.tsx";
import ImageUploadForm from "./component/ImageUpload/ImageUploadForm.tsx";
import ImagePreview from "./component/ImageUpload/ImagePreview.tsx";


function App() {

  const [defaultInfo, setDefaultInfo] = useState<TDefault>({title: '預設標題', remark: '無', time: '無', place: '無'});
  const [images, setImages] = useState<Array<CustomImage>>([]);

  return (
    <div className='h-full'>
      <h1 className='my-4 text-4xl font-bold'>貼圖鴿手</h1>
      {/*<div className='f-lex flex-col items-center justify-center'>*/}
      <InfoForm setDefaultInfo={setDefaultInfo}/>
      <div className="divider"></div>
      <div className='flex mb-10'>
        <div className="tabs tabs-lift mx-auto">
          <input type="radio" name="my_tabs_3" className="tab" aria-label="普通上傳" defaultChecked/>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <ImageUploadForm setImages={setImages} defaultInfo={defaultInfo}/>
          </div>
          <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"/>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            Tab content 2
          </div>
        </div>
      </div>
      {/*圖片預覽*/}
      <ImagePreview images={images} setImages={setImages}/>
      {/*底端欄*/}
      <div className='sticky bottom-0 bg-black border-t-2 flex py-2'>
        <div>
          共上傳 {images.length} 張圖片
        </div>
        <button className='btn btn-sm mx-2 ml-auto'>列印</button>
        <button className='btn btn-sm mx-2'>另存PDF</button>
      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
