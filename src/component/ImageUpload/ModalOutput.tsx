import Modal from "../Layout/Modal.tsx";
import React, {Dispatch, SetStateAction} from "react";
import {CustomImage} from "../../utils/type.ts";
import TextInput from "../InfoForm/TextInput.tsx";
import {useForm} from "react-hook-form";
import {BiSolidFileExport} from "react-icons/bi";

type Props = {
  readonly isModalShow: boolean,
  readonly setIsModalShow: (value: boolean) => void,
}

export default function ModalOutput({isModalShow, setIsModalShow}: Props) {

  const handleModalHide = () => setIsModalShow(false);
  const {register, handleSubmit} = useForm({defaultValues: {title: '刑案照片黏貼表'}});

  return (
    <Modal isShow={isModalShow} onHide={handleModalHide}>
      <div className='flex justify-center items-center'>
        <BiSolidFileExport className='text-lg mr-2'/>
        <span className='text-lg font-bold'>輸出檔案</span>
      </div>
      <div className='mt-5'>
        <form >
          <div className='mx-auto'>
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
              <legend className="fieldset-legend">輸出設定</legend>
              <TextInput name='title' label={'檔案標題'} register={register}/>
            </fieldset>
          </div>
          <div>
            <button className='btn btn-success btn-sm'>儲存Word檔</button>
          </div>
        </form>
      </div>
    </Modal>
  )
}