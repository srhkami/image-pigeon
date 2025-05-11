import Modal from "../Layout/Modal.tsx";
import {MdNumbers} from "react-icons/md"
import {HiOutlineClipboardList} from "react-icons/hi";
import {TVersionCheck} from "../../utils/type.ts";

type Props = {
  readonly isShow: boolean,
  readonly onHide: () => void,
  readonly data: TVersionCheck | null,
}

export default function ModalNewVersion({isShow, onHide, data}: Props) {
  return (
    <Modal isShow={isShow} onHide={onHide} closeButton>
      <div className='text-lg font-bold mt-1 mb-4'>有新版本可供下載！</div>
      <div className='grid grid-cols-4'>
        <div className='flex justify-start items-center my-3'>
          <MdNumbers className='mr-2'/>
          最新版本
        </div>
        <div className='col-span-3 flex justify-start items-center'>
          {data?.version}
        </div>
        <div className='flex justify-start items-center my-3'>
          <HiOutlineClipboardList className='mr-2'/>
          更新內容
        </div>
        <div className='col-span-3 flex justify-start items-center text-start'>
          {data?.changelog}
        </div>
      </div>
      <div className='flex justify-end'>
        <a className='btn btn-sm btn-soft btn-info' href={data?.url} target='_blank'>立即更新</a>
      </div>
    </Modal>
  )
}