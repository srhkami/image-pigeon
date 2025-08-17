import {CustomImage} from "@/utils/type.ts";
import {BiSolidFileExport} from "react-icons/bi";
import {Modal} from "@/component/index.ts";
import {Button, ModalBody, ModalHeader} from "@/component";
import {useModal} from "@/hooks";
import SaveImages from "@/features/Output/SaveImages.tsx";
import SaveWord from "@/features/Output/SaveWord.tsx";
import SaveJson from "@/features/Output/SaveJson.tsx";

type Props = {
  readonly images: CustomImage[],
}

export default function ModalOutput({images}: Props) {

  const {isShow, onShow, onHide} = useModal();


  // const onSaveJson: SubmitHandler<TOutputData> = (formData) => {
  //   setIsLoading(true);
  //   showToast(
  //     async () => {
  //       const res1 = await window.pywebview.api.select_path({mode: 'json'});
  //       checkStatus(res1);
  //       const data = {
  //         ...formData,
  //         images: images,
  //         path: res1.message
  //       }
  //       const res2 = await window.pywebview.api.save_json(data);
  //       checkStatus(res2);
  //       setIsLoading(false);
  //     },
  //     {success: '儲存成功', error: err => err.toString()}
  //   )
  //     .then(() => onHide())
  //     .finally(() => setIsLoading(false))
  // }

  return (
    <>
      <Button color='success' disabled={images.length === 0}
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
            <input type="radio" name="output_tabs" className="tab" aria-label="儲存專用檔案" defaultChecked/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveJson images={images}/>
            </div>
            <input type="radio" name="output_tabs" className="tab" aria-label="另存圖片" />
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveImages images={images}/>
            </div>
            {/*<input type="radio" name="output_tabs" className="tab" aria-label="直接列印"/>*/}
            {/*<div className="tab-content bg-base-100 border-base-300 p-6">*/}
            {/*  <Print images={images}/>*/}
            {/*</div>*/}
            <input type="radio" name="output_tabs" className="tab" aria-label="儲存WORD"/>
            <div className="tab-content bg-base-100 border-base-300 p-6">
              <SaveWord images={images}/>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  )
}