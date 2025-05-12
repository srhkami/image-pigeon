import UploadMultiple from "./UploadMultiple.tsx";
import UploadLongScreen from "./UploadLongScreen.tsx";
import Modal from "../Layout/Modal.tsx";
import {CustomImage} from "../../utils/type.ts";
import {Dispatch, SetStateAction} from "react";
import {MdOutlineUploadFile} from "react-icons/md";
import {useForm} from "react-hook-form";
import { IoMdAlert } from "react-icons/io";

type Props = {
  readonly isModalShow: boolean,
  readonly setIsModalShow: (value: boolean) => void,
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
}

export default function ModalUpload({isModalShow, setIsModalShow, setImages}: Props) {

  const {register, watch} = useForm({
    defaultValues: {
      remark: '時間：年月日時分\n地點：XX市\n說明：嫌疑人OOO',
    }
  })

  const [remark] = watch(['remark']);

  return (
    <Modal isShow={isModalShow} onHide={() => setIsModalShow(false)} closeButton>
      <div className='flex justify-center items-center'>
        <MdOutlineUploadFile className='text-lg mr-2'/>
        <span className='text-lg font-bold'>新增圖片</span>
      </div>
      <div className='mt-5'>
        <form>
          <label className="floating-label">
            <span>圖片預設說明</span>
            <textarea id='remark' className="textarea textarea-sm w-full" placeholder="圖片預設說明"
                      {...register('remark')}></textarea>
          </label>
        </form>
      </div>
      <div role="alert" className="alert mt-2">
        <IoMdAlert className='text-lg'/>
        <span>預設說明會套用在此次新增的每一張圖片上</span>
      </div>
      <div className='divider'></div>
      <div className="tabs tabs-lift mx-auto">
        <input type="radio" name="my_tabs_3" className="tab" aria-label="普通上傳" defaultChecked/>
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <UploadMultiple setImages={setImages} defaultRemark={remark} setIsModalShow={setIsModalShow}/>
        </div>
        <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"/>
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <UploadLongScreen setImages={setImages} defaultRemark={remark} setIsModalShow={setIsModalShow}/>
        </div>
      </div>
    </Modal>
  )
}