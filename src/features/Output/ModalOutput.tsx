import {BiSolidFileExport} from "react-icons/bi";
import {Modal} from "@/component/index.ts";
import {Button, ModalBody, ModalHeader} from "@/component";
import {useModal} from "@/hooks";
import SaveImages from "@/features/Output/SaveImages.tsx";
import SaveWord from "@/features/Output/SaveWord.tsx";
import {ProjectV2} from '@/types/project.ts'
import SaveProject from '@/features/Output/SaveProject.tsx'
import {FiPrinter} from 'react-icons/fi';
import {useState} from "react";
import {PrintAlignVertical, PrintFontSize, PrintPreviewOptions} from "@/features/PrintPreview/printLayout.ts";

type Props = {
  readonly project: ProjectV2,
  readonly setProject: (project: ProjectV2) => void,
  readonly sessionId: string | null,
  readonly itemCount: number,
  readonly onEnterPrintPreview: (options: PrintPreviewOptions) => void,
}

export default function ModalOutput({project, setProject, sessionId, itemCount, onEnterPrintPreview}: Props) {

  const {isShow, onShow, onHide} = useModal();
  const [printTitle, setPrintTitle] = useState(project.document.title || '照片黏貼表')
  const [printFontSize, setPrintFontSize] = useState<PrintFontSize>('12')
  const [printAlignVertical, setPrintAlignVertical] = useState<PrintAlignVertical>('center')

  const handlePrintPreview = () => {
    onHide()
    onEnterPrintPreview({
      title: printTitle.trim() || '照片黏貼表',
      fontSize: printFontSize,
      alignVertical: printAlignVertical,
    })
  }

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
            <input type="radio" name="output_tabs" className="tab" aria-label="儲存WORD" defaultChecked/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveWord project={project} sessionId={sessionId} itemCount={itemCount}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="儲存專案"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveProject project={project} setProject={setProject} sessionId={sessionId} itemCount={itemCount}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="另存圖片" />
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveImages project={project} sessionId={sessionId} itemCount={itemCount}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="預覽列印 / PDF"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <div className='space-y-4'>
                <div className='alert alert-info text-sm'>
                  會開啟全頁 A4 預覽；「另存 PDF」第一階段會透過系統列印對話框完成。
                </div>
                <label className='form-control w-full'>
                  <div className='label'>
                    <span className='label-text'>文件標題</span>
                  </div>
                  <input
                    type='text'
                    className='input input-bordered w-full'
                    value={printTitle}
                    onChange={(event) => setPrintTitle(event.target.value)}
                  />
                </label>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>說明文字對齊</span>
                    </div>
                    <select
                      className='select select-bordered w-full'
                      value={printAlignVertical}
                      onChange={(event) => setPrintAlignVertical(event.target.value as PrintAlignVertical)}
                    >
                      <option value='top'>垂直置頂</option>
                      <option value='center'>垂直置中</option>
                    </select>
                  </label>
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>字體大小</span>
                    </div>
                    <select
                      className='select select-bordered w-full'
                      value={printFontSize}
                      onChange={(event) => setPrintFontSize(event.target.value as PrintFontSize)}
                    >
                      <option value='10'>小（10）</option>
                      <option value='11'>偏小（11）</option>
                      <option value='12'>普通（12）</option>
                      <option value='13'>偏大（13）</option>
                      <option value='14'>大（14）</option>
                    </select>
                  </label>
                </div>
                <Button
                  color='primary'
                  shape='block'
                  onClick={handlePrintPreview}
                  disabled={itemCount === 0 || !sessionId}
                >
                  <FiPrinter/>
                  開啟預覽列印
                </Button>
              </div>
            </div>

          </div>
        </ModalBody>
      </Modal>
    </>
  )
}
