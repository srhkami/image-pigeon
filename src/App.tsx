import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage, TDefault} from "./utils/type.ts";
import InfoForm from "./component/InfoForm/InfoForm.tsx";
import ImagePreview from "./component/ImagePreview/ImagePreview.tsx";
import Nav from "./component/Layout/Nav.tsx";
import Footer from "./component/Layout/Footer.tsx";
import ModalUpload from "./component/ImageUpload/ModalUpload.tsx";


function App() {

  const [defaultInfo, setDefaultInfo] = useState<TDefault>({title: '刑案照片黏貼表', remark: '無'});
  const [images, setImages] = useState<Array<CustomImage>>([]);
  const [isModalShow, setIsModalShow] = useState<boolean>(false);

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
        handleUploadModalClose={() => setIsModalShow(false)}
      />
      {/*新增圖片的對話框*/}
      <ModalUpload isModalShow={isModalShow} setIsModalShow={setIsModalShow}
                   setImages={setImages} defaultInfo={defaultInfo}
      />
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
