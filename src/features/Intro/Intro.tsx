import {BsFillPersonLinesFill} from "react-icons/bs";
import {MdNumbers} from "react-icons/md";
import {AppVersionText} from "@/utils/log.ts";
import ModalTip from "./ModalTip.tsx";
import ModalFeedback from "./ModalFeedback.tsx";
import {Badge, Col, Row} from "@/component";
import {EXTERNAL_NAVIGATION_URLS} from '@/services/browserExternalNavigation.ts'

export default function Intro() {
  return (
    <div className='flex justify-center items-center'>
      <div className="card w-96 my-10 border-3 border-base-300 shadow-xl">
        <div className='card-body'>
          <Row>
            <Col xs={3} className='text-lg font-bold flex items-center my-2'>
              <Badge color='info'>Step 1</Badge>
            </Col>
            <Col xs={9} className='text-lg font-bold flex items-center my-2'>
              請將圖片拖曳到此處
            </Col>
            <Col xs={3} className='text-lg font-bold flex items-center my-2'>
              <Badge color='info'>Step 2</Badge>
            </Col>
            <Col xs={9} className='text-lg font-bold flex items-center my-2'>
              預覽、排序、編輯圖片
            </Col>
            <Col xs={3} className='text-lg font-bold flex items-center my-2'>
              <Badge color='info'>Step 3</Badge>
            </Col>
            <Col xs={9} className='text-lg font-bold flex items-center my-2'>
              <div className='col-span-3 text-lg font-bold flex items-center'>
                點擊
                <button className='btn btn-sm mx-2 btn-outline'>
                  輸出檔案
                </button>
                按鈕
              </div>
            </Col>
            <Col xs={12} className='text-lg font-bold my-3'>
              恭喜您完成一份照片黏貼表！
            </Col>
            <Col xs={12} className='text-lg font-bold flex justify-end'>
              <ModalTip/>
            </Col>
          </Row>
          <div className='divider my-1 text-xs'>關於此軟體</div>
          <div className='grid grid-cols-5 gap-2 font-bold'>
            <div className='flex justify-start items-center'>
              <BsFillPersonLinesFill className='mr-2'/>
              作者
            </div>
            <div className='col-span-2 text-start'>
              蔡智楷 C.K.SAI
              <br/>
              <span className='text-xs'>警政署資訊室</span>
            </div>
            <div className='col-span-2 flex'>
              <ModalFeedback/>
            </div>
            <div className='flex justify-start items-center'>
              <MdNumbers className='mr-2'/>
              版本
            </div>
            <div className='col-span-2 text-start flex items-center'>
              {AppVersionText}
            </div>
          </div>
          <div className='divider my-1 text-xs'>作者的網站</div>
          <Row>
            <Col xs={6} className='px-1'>
              <a className='btn btn-outline w-full' target='_blank' rel='noopener noreferrer'
                 href={EXTERNAL_NAVIGATION_URLS.pigeonHand}>
                <img src={`${import.meta.env.BASE_URL}Logo_PH.png`} alt="" className='w-4 h-4'/>
                鴿手
              </a>
            </Col>
            <Col xs={6} className='px-1'>
              <a className='btn btn-outline w-full' target='_blank' rel='noopener noreferrer'
                 href={EXTERNAL_NAVIGATION_URLS.trafficPigeonHand}>
                <img src={`${import.meta.env.BASE_URL}Logo_TP.png`} alt="" className='w-5 h-5'/>
                交通鴿手
              </a>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}