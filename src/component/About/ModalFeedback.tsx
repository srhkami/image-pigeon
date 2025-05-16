import Modal from "../Layout/Modal.tsx";
import {useState} from "react";
import QRcode from '../../assets/line_qrcode.jpg'

export default function ModalFeedback() {

  const [isModalShow, setIsModalShow] = useState<boolean>(false);

  return (
    <>
      <button className='btn btn-info btn-sm btn-soft ml-auto' onClick={() => setIsModalShow(true)}>
        聯繫作者
      </button>
      <Modal isShow={isModalShow} onHide={() => setIsModalShow(false)} closeButton>
        <div className='text-lg font-bold mb-2'>聯繫作者</div>
        <div className='flex'>
          <div className='flex-2/5 p-3'>
            <a href="https://line.me/ti/p/mvI1aBkiy6" className="" target='_blank'>
              <img src={QRcode} alt="QR code"/>
            </a>
          </div>
          <div className='flex-3/5 p-3 text-start '>
            如果您有任何問題或寶貴建議，歡迎讓我知道，您可以點擊或掃描左側 QR Code 直接私訊作者
            <div className='divider'></div>
            或者到「交通鴿手」中
            <a className='link link-info'
               href="https://trafficpigeon.com/feedback/web" target='_blank'>
              填寫表單
            </a>
            回覆
          </div>
        </div>
      </Modal>
    </>
  )
}