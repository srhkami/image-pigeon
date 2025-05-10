import './App.css'
import {Toaster} from "react-hot-toast";
import {useState} from "react";
import {CustomImage} from "./utils/type.ts";
import ImagePreview from "./component/ImagePreview/ImagePreview.tsx";
import Nav from "./component/Layout/Nav.tsx";
import Footer from "./component/Layout/Footer.tsx";
import ModalUpload from "./component/ImageUpload/ModalUpload.tsx";
import ModalOutput from "./component/ImageOutput/ModalOutput.tsx";
import {BsFillPersonLinesFill} from "react-icons/bs";
import {MdNumbers} from "react-icons/md";


function App() {

  const [images, setImages] = useState<Array<CustomImage>>([]);
  const [isUploadShow, setIsUploadShow] = useState<boolean>(false); // 上傳對話框
  const [isOutputShow, setIsOutputShow] = useState<boolean>(false); // 輸出對話框

  return (
    <div>
      <Nav/>
      {!images.length &&
        <div className='flex justify-center items-center'>
          <div className="card bg-neutral text-neutral-content w-96 my-28">
            <div className='card-body'>
              <div className='grid grid-cols-4 gap-4'>
                <div className="badge badge-md badge-accent my-3">Step 1</div>
                <div className='col-span-3 text-lg font-bold flex items-center'>
                  點擊左下角
                  <button className='btn btn-sm btn-primary btn-outline mx-2'>
                    新增圖片
                  </button>
                  按鈕
                </div>
                <div className="badge badge-md badge-accent my-3">Step 2</div>
                <div className='col-span-3 text-lg font-bold flex items-center'>
                  預覽、排序、編輯圖片
                </div>
                <div className="badge badge-md badge-accent my-3">Step 3</div>
                <div className='col-span-3 text-lg font-bold flex items-center'>
                  點擊右下角
                  <button className='btn btn-sm btn-success mx-2 btn-outline'>
                    輸出檔案
                  </button>
                  按鈕
                </div>
                <div className='col-span-4 text-lg font-bold mt-3'>
                  恭喜您完成一份照片黏貼表！
                </div>
              </div>
              <div className='divider'></div>
              <div className='grid grid-cols-4 gap-2 font-bold text-gray-300'>
                <div className='flex justify-start items-center'>
                  <BsFillPersonLinesFill className='mr-2'/>
                  作者
                </div>
                <div className='col-span-3 text-start'>蔡智楷 C.K.SAI</div>
                <div className='flex justify-start items-center'>
                  <MdNumbers className='mr-2'/>
                  版本
                </div>
                <div className='col-span-3 text-start'>1.0_1140510</div>
                <div className='col-span-4 flex justify-end'>
                  本軟體分享於 <a href="https://trafficpigeon.com/" className="link link-primary" target='_blank'>交通鴿手</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <ImagePreview images={images} setImages={setImages}/>
      {/*圖片預覽*/}

      {/*底端欄*/}
      <Footer
        images={images}
        handleUploadModalShow={() => setIsUploadShow(true)}
        handleOutputModalShow={() => setIsOutputShow(true)}
      />
      {/*對話框*/}
      <ModalUpload isModalShow={isUploadShow} setIsModalShow={setIsUploadShow} setImages={setImages}/>
      <ModalOutput isModalShow={isOutputShow} setIsModalShow={setIsOutputShow} images={images}/>
      {/*快速彈窗*/}
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
    </div>
  )
}

export default App
