import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage} from "./utils/type.ts";
import ImagePreview from "@/features/ImagePreview/ImagePreview.tsx";
import Nav from "./layout/Nav.tsx";
import Footer from "./layout/Footer.tsx";
import Intro from "@/features/About/Intro.tsx";
import ModalNewVersion from "@/features/About/ModalNewVersion.tsx";


function App() {

  const [images, setImages] = useState<Array<CustomImage>>([]);

  return (
    <div>
      <Nav/>
      {!images.length && <Intro/>}
      {/*圖片預覽*/}
      <ImagePreview images={images} setImages={setImages}/>
      {/*底端欄*/}
      <Footer
        images={images}
        setImages={setImages}
      />
      {/*對話框*/}
      <ModalNewVersion/>
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
