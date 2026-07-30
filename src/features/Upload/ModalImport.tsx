import {Alert, Modal, ModalBody, ModalHeader} from "@/component";
import {LuImageUp} from "react-icons/lu";
import {IoMdAlert} from "react-icons/io";
import AlertLoading from "../../layout/AlertLoading.tsx";
import UploadMultiple from "@/features/Upload/UploadMultiple.tsx";
import UploadLongScreen from "@/features/Upload/UploadLongScreen.tsx";
import ReadJson from "@/features/Upload/ReadJson.tsx";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {CustomImage} from "@/utils/type.ts";
import {ProjectV2} from "@/types/project.ts";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly project: ProjectV2,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly sessionId: string | null,
  readonly setSessionId: Dispatch<SetStateAction<string | null>>,
  readonly isShow: boolean,
  readonly pendingFiles?: File[],
  readonly onHide: () => void,
}

type ImportTab = 'multiple' | 'long-screen' | 'legacy-json'

export default function ModalImport({
  setImages,
  project,
  setProject,
  sessionId,
  setSessionId,
  isShow,
  pendingFiles = [],
  onHide,
}: Props) {

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<ImportTab>('multiple')

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
      <Modal isShow={isShow} onHide={onHide} closeButton>
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
              <AlertLoading count={count}/>
              :
              <div className="tabs tabs-lift mx-auto">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="一般圖片"
                       checked={activeTab === 'multiple'} onChange={() => setActiveTab('multiple')}/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadMultiple setImages={setImages} defaultRemark={remark}
                                  onHide={onHide} setIsLoading={setIsLoading} setCount={setCount}
                                  project={project} setProject={setProject}
                                  sessionId={sessionId} setSessionId={setSessionId}
                                  pendingFiles={pendingFiles}/>
                </div>
                <input type="radio" name="my_tabs_3" className="tab" aria-label="長截圖分割"
                       checked={activeTab === 'long-screen'} onChange={() => setActiveTab('long-screen')}/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <UploadLongScreen setImages={setImages} defaultRemark={remark}
                                    onHide={onHide} setIsLoading={setIsLoading} setCount={setCount}
                                    project={project} setProject={setProject}
                                    sessionId={sessionId} setSessionId={setSessionId}/>
                </div>
                <input type="radio" name="my_tabs_3" className="tab" aria-label="讀取舊檔"
                       checked={activeTab === 'legacy-json'} onChange={() => setActiveTab('legacy-json')}/>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                  <ReadJson setImages={setImages} onHide={onHide} setIsLoading={setIsLoading}/>
                </div>
              </div>
          }
        </ModalBody>
      </Modal>
    </>
  )
}