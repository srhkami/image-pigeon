import {useState} from "react";
import QRcode from '../../assets/line_qrcode.jpg'
import {Button, Modal, ModalHeader} from "@/component";
import { MdFeedback } from "react-icons/md";

export default function ModalFeedback() {

  const [isModalShow, setIsModalShow] = useState<boolean>(false);

  return (
    <>
      <Button color='info' size='sm' style='outline' className='ml-auto'
              onClick={() => setIsModalShow(true)}>
        聯繫作者
      </Button>
      <Modal isShow={isModalShow} onHide={() => setIsModalShow(false)} closeButton>
        <ModalHeader className='justify-center text-lg font-bold mb-2'>
          <MdFeedback className='mr-2'/>聯繫作者
        </ModalHeader>
        <div className='flex'>
          <div className='flex-2/5 p-3'>
            <a href="https://line.me/ti/p/mvI1aBkiy6" className="" target='_blank'>
              <img src={QRcode} alt="QR code"/>
            </a>
          </div>
          <div className='flex-3/5 p-3 text-start '>
            如果您有任何問題或寶貴建議，歡迎讓我知道，您可以點擊或掃描左側 QR Code 直接私訊作者
            <div className='divider'></div>
            或者到「鴿手」中
            <a className='link link-info'
               href="https://pigeonhand.tw/feedback/web" target='_blank'>
              填寫表單
            </a>
            回覆
          </div>
        </div>
      </Modal>
    </>
  )
}