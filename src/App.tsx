import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage} from "./utils/type.ts";
import {Footer, Nav} from "@/layout";
import {ImagePreview, Intro, ModalNewVersion} from "@/features";

function App() {

  const [images, setImages] = useState<Array<CustomImage>>([]);

  return (
    <div>
      <Nav/>
      <div className='min-h-[84vh]'>

        {!images.length && <Intro/>}
        {/*圖片預覽*/}
        <ImagePreview images={images} setImages={setImages}/>
      </div>
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
