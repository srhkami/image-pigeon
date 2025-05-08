import './App.css'
import toast, {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage, TDefault} from "./utils/type.ts";
import InfoForm from "./component/InfoForm/InfoForm.tsx";
import ImagePreview from "./component/ImagePreview/ImagePreview.tsx";
import Nav from "./component/Layout/Nav.tsx";
import Modal from "./component/Layout/Modal.tsx";
import UploadMultiple from "./component/ImageUpload/UploadMultiple.tsx";
import UploadLongScreen from "./component/ImageUpload/UploadLongScreen.tsx";


function App() {

  const [defaultInfo, setDefaultInfo] = useState<TDefault>({title: '刑案照片黏貼表', remark: '無'});
  const [images, setImages] = useState<Array<CustomImage>>([]);

  const [isModalShow, setIsModalShow] = useState<boolean>(false);

  const handleSendData = () => {
    const data = {
      title: defaultInfo.title,
      images: images,
    }

    window.pywebview.api.send_images(data)
      .then(res => {
        console.log(res);
        if (res.status == 200) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      })
  }

  return (
    <div className='h-full'>
      <Nav/>

      <InfoForm setDefaultInfo={setDefaultInfo}/>
      <div className="divider"></div>
      {/*圖片預覽*/}
      <ImagePreview images={images} setImages={setImages}/>
      {/*新增圖片的對話框*/}
      <Modal isShow={isModalShow} onHide={() => setIsModalShow(false)} closeButton>
        <div>新增圖片</div>
        <div className="tabs tabs-lift mx-auto">
          <input type="radio" name="my_tabs_3" className="tab" aria-label="普通上傳" defaultChecked/>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <UploadMultiple setImages={setImages} defaultInfo={defaultInfo} setIsModalShow={setIsModalShow}/>
          </div>
          <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"/>
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <UploadLongScreen setImages={setImages} defaultInfo={defaultInfo} setIsModalShow={setIsModalShow}/>
          </div>
        </div>
      </Modal>
      {/*底端欄*/}
      <div className='sticky bottom-0 bg-black border-t-2 flex py-2'>
        <button className='btn btn-sm btn-primary mx-2' onClick={() => setIsModalShow(true)}>新增圖片</button>
        <div>
          共有 {images.length} 張圖片
        </div>
        <button className='btn btn-sm mx-2 ml-auto'>列印</button>
        <button className='btn btn-sm mx-2' onClick={handleSendData}>發送</button>

      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
