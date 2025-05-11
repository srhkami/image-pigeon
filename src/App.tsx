import './App.css'
import {Toaster} from "react-hot-toast";
import {useEffect, useState} from "react";
import {CustomImage, TVersionCheck} from "./utils/type.ts";
import ImagePreview from "./component/ImagePreview/ImagePreview.tsx";
import Nav from "./component/Layout/Nav.tsx";
import Footer from "./component/Layout/Footer.tsx";
import ModalUpload from "./component/ImageUpload/ModalUpload.tsx";
import ModalOutput from "./component/ImageOutput/ModalOutput.tsx";
import Intro from "./component/About/Intro.tsx";
import ModalNewVersion from "./component/About/ModalNewVersion.tsx";
import {AppVersion, handleCheckVersion} from "./utils/info.ts";


function App() {

  const [images, setImages] = useState<Array<CustomImage>>([]);
  const [versionData, setVersionData] = useState<TVersionCheck | null>(null); // 更新資料
  const [isUploadShow, setIsUploadShow] = useState<boolean>(false); // 上傳對話框
  const [isOutputShow, setIsOutputShow] = useState<boolean>(false); // 輸出對話框
  const [isVersionShow, setIsVersionShow] = useState<boolean>(false); // 輸出對話框

  useEffect(() => {
    handleCheckVersion()
      .then(data => {
        if (data.version !== AppVersion)
        setVersionData(data);
        setIsVersionShow(true);
      })
  }, []);

  return (
    <div>
      <Nav/>
      {!images.length && <Intro/>}
      {/*圖片預覽*/}
      <ImagePreview images={images} setImages={setImages}/>
      {/*底端欄*/}
      <Footer
        images={images}
        handleUploadModalShow={() => setIsUploadShow(true)}
        handleOutputModalShow={() => setIsOutputShow(true)}
      />
      {/*對話框*/}
      <ModalUpload isModalShow={isUploadShow} setIsModalShow={setIsUploadShow} setImages={setImages}/>
      <ModalOutput isModalShow={isOutputShow} setIsModalShow={setIsOutputShow} images={images}/>
      <ModalNewVersion isShow={isVersionShow} onHide={()=>setIsVersionShow(false)} data={versionData}/>
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
