import {Alert, Modal, ModalBody, ModalHeader} from "@/component";
import {LuImageUp} from "react-icons/lu";
import {IoMdAlert} from "react-icons/io";
import AlertLoading from "../../layout/AlertLoading.tsx";
import UploadMultiple from "@/features/Upload/UploadMultiple.tsx";
import UploadLongScreen from "@/features/Upload/UploadLongScreen.tsx";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {CustomImage} from "@/utils/type.ts";
import {ProjectV2} from "@/types/project.ts";
import {
  browserImportOperationCoordinator,
  type BrowserProjectOperationLease,
} from "@/services/browserProjectOperation.ts";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly isShow: boolean,
  readonly pendingFiles?: File[],
  readonly onHide: () => void,
}

type ImportTab = 'multiple' | 'long-screen'

export default function ModalImport({
  setImages,
  setProject,
  isShow,
  pendingFiles = [],
  onHide,
}: Props) {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ImportTab>('multiple')
  const operationRef = useRef<BrowserProjectOperationLease | null>(null)

  const beginImport = useCallback(() => {
    operationRef.current?.cancel()
    const lease = browserImportOperationCoordinator.begin()
    operationRef.current = lease
    return lease.signal
  }, [])

  const finishImport = useCallback((signal: AbortSignal) => {
    if (operationRef.current?.signal === signal) {
      operationRef.current.finish()
      operationRef.current = null
    }
  }, [])

  const handleHide = useCallback(() => {
    operationRef.current?.cancel()
    operationRef.current = null
    setIsLoading(false)
    onHide()
  }, [onHide])

  useEffect(() => () => operationRef.current?.cancel(), [])

  const {register, watch} = useForm({
    defaultValues: {
      remark: '時間：年月日時分\n地點：XX市\n說明：嫌疑人OOO',
    }
  })
  const [remark] = watch(['remark']);

  useEffect(() => {
    if (isShow) {
      setActiveTab('multiple')
    }
  }, [isShow, pendingFiles])

  return (
    <>
      <Modal isShow={isShow} onHide={handleHide} closeButton>
        <ModalHeader className='justify-center text-lg font-bold'>
          <LuImageUp className='mr-2'/>
          <span>導入圖片</span>
        </ModalHeader>
        <ModalBody>
          <form className='mt-2 p-1'>
            <label className="floating-label">
              <span>圖片預設備註</span>
              <textarea id='remark' className="textarea w-full" placeholder="圖片預設說明"
                        {...register('remark')}></textarea>
            </label>
          </form>
          <Alert color='info' className='mt-2'>
            <IoMdAlert className='text-lg'/>
            <span>預設備註會套用在本次新增的每一張圖片上</span>
          </Alert>
          <div className='divider'></div>
          {
            isLoading ?
              <div className='flex flex-col gap-3'>
                <AlertLoading count={count}/>
                <button type='button' className='btn btn-error btn-outline' onClick={handleHide}>取消處理</button>
              </div>
              :
              <div className="tabs tabs-lift mx-auto">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="一般圖片"
                       checked={activeTab === 'multiple'} onChange={() => setActiveTab('multiple')}/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadMultiple setImages={setImages} defaultRemark={remark}
                                  onHide={handleHide} setIsLoading={setIsLoading} setCount={setCount}
                                  setProject={setProject}
                                  pendingFiles={pendingFiles} beginImport={beginImport} finishImport={finishImport}/>
                </div>
                <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"
                       checked={activeTab === 'long-screen'} onChange={() => setActiveTab('long-screen')}/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadLongScreen setImages={setImages} defaultRemark={remark}
                                    onHide={handleHide} setIsLoading={setIsLoading} setCount={setCount}
                                    setProject={setProject} beginImport={beginImport} finishImport={finishImport}/>
                </div>
              </div>
          }
        </ModalBody>
      </Modal>
    </>
  )
}