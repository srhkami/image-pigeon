import {BsFillPersonLinesFill} from "react-icons/bs";
import {MdNumbers} from "react-icons/md";
import {AppVersion} from "../../utils/info.ts";
import ModalTip from "./ModalTip.tsx";
import { FaShareAlt } from "react-icons/fa";

export default function Intro() {
  return (
    <div className='flex justify-center items-center'>
      <div className="card bg-neutral text-neutral-content w-96 my-20">
        <div className='card-body'>
          <div className='grid grid-cols-4 gap-4'>
            <div className="badge badge-md badge-accent my-3">Step 1</div>
            <div className='col-span-3 text-lg font-bold flex items-center'>
              點擊左下角
              <button className='btn btn-sm  btn-outline mx-2'>
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
              <button className='btn btn-sm mx-2 btn-outline'>
                輸出檔案
              </button>
              按鈕
            </div>
            <div className='col-span-4 text-lg font-bold my-2'>
              恭喜您完成一份照片黏貼表！
            </div>
            <div className='col-span-4 flex justify-end'>
              <ModalTip/>
            </div>
          </div>
          <div className='divider my-1'></div>
          <div className='grid grid-cols-5 gap-2 font-bold text-gray-300'>
            <div className='flex justify-start items-center'>
              <BsFillPersonLinesFill className='mr-2'/>
              作者
            </div>
            <div className='col-span-2 text-start'>
              蔡智楷 C.K.SAI
              <br/>
              <span className='text-xs'>嘉義縣警察局民雄分局</span>
            </div>
            <div className='col-span-2 flex'>
              <a className='btn btn-info btn-sm btn-soft ml-auto' href="https://trafficpigeon.com/feedback/web"
                 target='_blank'>聯繫作者</a>
            </div>
            <div className='flex justify-start items-center'>
              <MdNumbers className='mr-2'/>
              版本
            </div>
            <div className='col-span-2 text-start flex items-center'>
              {AppVersion}
            </div>
            <div className='col-span-2 flex'>
              <a className='btn btn-info btn-sm btn-soft ml-auto' target='_blank'
                      href='https://drive.google.com/drive/folders/1VRCiQbSn09LS3aWd4mgw_Eczls9wJsRm?usp=drive_link'>
                檢查新版
              </a>
            </div>
            <div className='col-span-5 flex justify-start items-center mt-2'>
              <FaShareAlt  className='mr-2'/>
              本軟體分享於
              <a className='link link-info ml-1' href="https://trafficpigeon.com/"
                 target='_blank'>交通鴿手</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}