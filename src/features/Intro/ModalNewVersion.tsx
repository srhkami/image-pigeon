import {MdNumbers} from "react-icons/md"
import {HiOutlineClipboardList} from "react-icons/hi";
import {VersionCheckData} from "@/utils/type.ts";
import {Button, Modal, ModalBody, ModalFooter} from "@/component";
import {useEffect, useState} from "react";
import {checkBrowserVersion} from '@/services/browserVersionCheck.ts'
import {AppVersion} from "@/utils/log.ts";
import {useModal} from "@/hooks";
import {
  IGNORED_UPDATE_DATE_KEY,
  ignoreLatestVersion,
  shouldShowLatestVersion,
} from "./newVersionDismissal.ts";

const DISMISSED_VERSION_KEY = 'image-pigeon.dismissed-new-version'

/**
 * 檢查新版本的對話框
 */
export default function ModalNewVersion() {

  const {isShow, onShow, onHide} = useModal()
  const [data, setData] = useState<VersionCheckData | null>(null); // 更新資料

  const handleHide = () => {
    if (data?.app_version) {
      sessionStorage.setItem(DISMISSED_VERSION_KEY, data.app_version)
    }
    onHide()
  }

  const handleIgnoreVersion = () => {
    if (data && ignoreLatestVersion(localStorage, data.updated_at)) {
      onHide()
    }
  }

  // 檢查新版本
  useEffect(() => {
    checkBrowserVersion()
      .then(data => {
        if (!data) return
        if (shouldShowLatestVersion({
          currentVersion: AppVersion,
          latestVersion: data.app_version,
          updatedAt: data.updated_at,
          ignoredDate: localStorage.getItem(IGNORED_UPDATE_DATE_KEY),
          sessionDismissedVersion: sessionStorage.getItem(DISMISSED_VERSION_KEY),
        })) {
          setData(data)
          onShow()
        }
      })
  }, [onShow]);

  return (
    <Modal isShow={isShow} onHide={handleHide} closeButton>
      <ModalBody>
        <div className='text-lg font-bold mt-1 mb-4'>有新版本可供下載！</div>
        <div className='grid grid-cols-4'>
          <div className='flex justify-start items-center my-3'>
            <MdNumbers className='mr-2'/>
            最新版本
          </div>
          <div className='col-span-3 flex justify-start items-center'>
            {data?.app_version}
          </div>
          <div className='flex justify-start items-center my-3'>
            <HiOutlineClipboardList className='mr-2'/>
            更新內容
          </div>
          <div className='col-span-3 flex justify-start items-center text-start whitespace-pre-wrap'>
            {data?.whats_new}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='gap-2'>
        <Button size='sm' style='outline' color='neutral' className='mr-auto' onClick={handleIgnoreVersion}>忽略此版本</Button>
        <a className='btn btn-sm btn-info' href={data?.download_link} target='_blank' rel='noopener noreferrer'>
          立即更新
        </a>
      </ModalFooter>
    </Modal>
  )
}