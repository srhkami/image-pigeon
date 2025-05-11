/* 設定的對話框 */
import {IoSettingsOutline} from "react-icons/io5";
import Modal from "./Modal.tsx";
import {useState} from "react";

export default function ModalSetting() {

  const [isShow, setIsShow] = useState(false);

  return (
    <>
      <button onClick={() => setIsShow(true)} className='btn btn-ghost btn-circle'>
        <IoSettingsOutline className='text-lg'/>
      </button>
      <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
        <div className='flex justify-center items-center'>
          <IoSettingsOutline className='text-lg mr-2'/>
          <span className='text-lg font-bold'>設定</span>
        </div>
      </Modal>
    </>
  )
}