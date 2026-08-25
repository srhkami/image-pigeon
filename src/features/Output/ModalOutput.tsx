import {BiSolidFileExport} from "react-icons/bi";
import {Modal} from "@/component/index.ts";
import {Button, ModalBody, ModalHeader} from "@/component";
import {useModal} from "@/hooks";
import SaveImages from "@/features/Output/SaveImages.tsx";
import SaveWord from "@/features/Output/SaveWord.tsx";
import {ProjectV2} from '@/types/project.ts'
import SaveProject from '@/features/Output/SaveProject.tsx'
import {PrintPreviewOptions} from "@/features/PrintPreview/printLayout.ts";
import PrintPreviewOutput from '@/features/Output/PrintPreviewOutput.tsx'

type Props = {
  readonly project: ProjectV2,
  readonly setProject: (project: ProjectV2) => void,
  readonly itemCount: number,
  readonly onEnterPrintPreview: (options: PrintPreviewOptions) => void,
}

export default function ModalOutput({project, setProject, itemCount, onEnterPrintPreview}: Props) {

  const {isShow, onShow, onHide} = useModal();

  return (
    <>
      <Button color='success' disabled={itemCount === 0}
              onClick={onShow}>
        <BiSolidFileExport/>
        輸出檔案
      </Button>
      <Modal isShow={isShow} onHide={onHide} closeButton>
        <ModalHeader className='flex justify-center items-center'>
          <BiSolidFileExport className='text-lg mr-2'/>
          <span className='text-lg font-bold'>輸出檔案</span>
        </ModalHeader>
        <ModalBody>
          <div className="tabs tabs-lift">
            <input type="radio" name="output_tabs" className="tab" aria-label="直接列印" defaultChecked/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <PrintPreviewOutput
                project={project}
                itemCount={itemCount}
                onCloseModal={onHide}
                onEnterPrintPreview={onEnterPrintPreview}
              />
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="儲存專案"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveProject project={project} setProject={setProject} itemCount={itemCount}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="另存WORD"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveWord project={project} itemCount={itemCount}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="另存圖片"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveImages project={project} itemCount={itemCount}/>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  )
}
