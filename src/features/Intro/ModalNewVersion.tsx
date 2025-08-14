import {MdNumbers} from "react-icons/md"
import {HiOutlineClipboardList} from "react-icons/hi";
import {TVersionCheck} from "@/utils/type.ts";
import {Modal, ModalBody} from "@/component";
import {useEffect, useState} from "react";
import axios from "axios";
import {AppVersion} from "@/utils/log.ts";
import {useModal} from "@/hooks";

/* 檢查新版本 */
const handleCheckVersion = async () => {
  const res = await axios({
    method: 'GET',
    url: 'https://api.pigeonhand.tw/web/app/image/latest/',
  })
  return res.data as TVersionCheck
}

/**
 * 檢查新版本的對話框
 */
export default function ModalNewVersion() {

  const {isShow, onShow, onHide} = useModal()
  const [data, setData] = useState<TVersionCheck | null>(null); // 更新資料

  // 檢查新版本
  useEffect(() => {
    handleCheckVersion()
      .then(data => {
        if (data.version !== AppVersion) {
          setData(data);
          onShow();
        }
      })
  }, []);

  return (
    <Modal isShow={isShow} onHide={onHide} closeButton>
      <ModalBody>
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
          <div className='col-span-3 flex justify-start items-center text-start whitespace-pre-wrap'>
            {data?.changelog}
          </div>
        </div>
        <div className='flex justify-end'>
          <a className='btn btn-sm btn-soft btn-info' href={data?.url} target='_blank'>
            立即更新
          </a>
        </div>
      </ModalBody>
    </Modal>
  )
}