import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage, TDefault} from "./utils/type.ts";
import InfoForm from "./component/InfoForm/InfoForm.tsx";
import ImagePreview from "./component/ImagePreview/ImagePreview.tsx";
import Nav from "./component/Layout/Nav.tsx";
import Footer from "./component/Layout/Footer.tsx";
import ModalUpload from "./component/ImageUpload/ModalUpload.tsx";
import ModalOutput from "./component/ImageUpload/ModalOutput.tsx";


function App() {

  const [defaultInfo, setDefaultInfo] = useState<TDefault>({title: '刑案照片黏貼表', remark: '無'});
  const [images, setImages] = useState<Array<CustomImage>>([]);
  const [isUploadShow, setIsUploadShow] = useState<boolean>(false); // 上傳對話框
  const [isOutputShow, setIsOutputShow] = useState<boolean>(false); // 輸出對話框

  return (
    <div className='h-full'>
      <Nav/>
      <InfoForm setDefaultInfo={setDefaultInfo}/>
      <div className="divider"></div>
      {/*圖片預覽*/}
      <ImagePreview images={images} setImages={setImages}/>

      {/*底端欄*/}
      <Footer
        images={images}
        defaultInfo={defaultInfo}
        handleUploadModalShow={() => setIsUploadShow(true)}
        handleOutputModalShow={() => setIsOutputShow(true)}
      />
      {/*對話框*/}
      <ModalUpload isModalShow={isUploadShow} setIsModalShow={setIsUploadShow} setImages={setImages}/>
      <ModalOutput isModalShow={isOutputShow} setIsModalShow={setIsOutputShow}/>
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
