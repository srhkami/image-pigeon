import UploadMultiple from "./UploadMultiple.tsx";
import UploadLongScreen from "./UploadLongScreen.tsx";
import {CustomImage} from "@/utils/type.ts";
import {Dispatch, SetStateAction, useState} from "react";
import {useForm} from "react-hook-form";
import {IoMdAlert} from "react-icons/io";
import AlertLoading from "../../layout/AlertLoading.tsx";
import {Button, Modal, ModalBody, ModalHeader} from "@/component";
import { LuImageUp } from "react-icons/lu";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
}

export default function ModalUpload({setImages}: Props) {

  const [isShow, setIsShow] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {register, watch} = useForm({
    defaultValues: {
      remark: '時間：年月日時分\n地點：XX市\n說明：嫌疑人OOO',
    }
  })
  const [remark] = watch(['remark']);

  return (
    <>
      <Button color='primary' onClick={() => setIsShow(true)}>
        <LuImageUp />
        新增圖片
      </Button>
      <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
        <ModalHeader className='justify-center text-lg font-bold'>
          <LuImageUp className='mr-2'/>
          <span>新增圖片</span>
        </ModalHeader>
        <ModalBody>
            <form className='mt-2 p-1'>
              <label className="floating-label">
                <span>圖片預設說明</span>
                <textarea id='remark' className="textarea w-full" placeholder="圖片預設說明"
                          {...register('remark')}></textarea>
              </label>
            </form>
          <div role="alert" className="alert mt-2">
            <IoMdAlert className='text-lg'/>
            <span>預設說明會套用在本次新增的每一張圖片上</span>
          </div>
          <div className='divider'></div>
          {
            isLoading ?
              <AlertLoading/>
              :
              <div className="tabs tabs-lift mx-auto">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="普通上傳" defaultChecked/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadMultiple setImages={setImages} defaultRemark={remark}
                                  setIsModalShow={setIsShow} setIsLoading={setIsLoading}/>
                </div>
                <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadLongScreen setImages={setImages} defaultRemark={remark}
                                    setIsModalShow={setIsShow} setIsLoading={setIsLoading}/>
                </div>
              </div>
          }
        </ModalBody>
      </Modal>
    </>
  )
}