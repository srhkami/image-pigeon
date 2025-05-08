import UploadMultiple from "./UploadMultiple.tsx";
import UploadLongScreen from "./UploadLongScreen.tsx";
import Modal from "../Layout/Modal.tsx";
import {CustomImage, TDefault} from "../../utils/type.ts";
import {Dispatch, SetStateAction} from "react";

type Props = {
  readonly isModalShow: boolean,
  readonly setIsModalShow: (value: boolean) => void,
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultInfo: TDefault,
}

export default function ModalUpload({isModalShow, setIsModalShow, setImages, defaultInfo}: Props) {

  return (
    <Modal isShow={isModalShow} onHide={() => setIsModalShow(false)} closeButton>
      <div>新增圖片</div>
      <div className="tabs tabs-lift mx-auto">
        <input type="radio" name="my_tabs_3" className="tab" aria-label="普通上傳" defaultChecked/>
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <UploadMultiple setImages={setImages} defaultInfo={defaultInfo} setIsModalShow={setIsModalShow}/>
        </div>
        <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"/>
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <UploadLongScreen setImages={setImages} defaultInfo={defaultInfo} setIsModalShow={setIsModalShow}/>
        </div>
      </div>
    </Modal>
  )
}