import Modal from "../Layout/Modal.tsx";
import {CustomImage} from "../../utils/type.ts";
import {useForm} from "react-hook-form";
import {BiSolidFileExport} from "react-icons/bi";
import toast from "react-hot-toast";
import {FaRegFileWord, FaRegFilePdf} from "react-icons/fa6";

type Props = {
  readonly images: CustomImage[],
  readonly isModalShow: boolean,
  readonly setIsModalShow: (value: boolean) => void,
}

type TFormValue = {
  title: string,
  piece: '2' | '6',
}

export default function ModalOutput({images, isModalShow, setIsModalShow}: Props) {

  const handleModalHide = () => setIsModalShow(false);
  const {register, watch} = useForm<TFormValue>({defaultValues: {title: '刑案照片黏貼表'}});

  const [title, piece] = watch(['title', 'piece']);

  const handleSaveDocx = () => {
    toast.loading('處理中，請稍候...')
    const data = {
      title: title,
      images: images,
    }
    window.pywebview.api.save_docx(data)
      .then(res => {
        console.log(res);
        toast.dismiss();
        if (res.status == 200) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      })
  }


  return (
    <Modal isShow={isModalShow} onHide={handleModalHide} closeButton>
      <div className='flex justify-center items-center'>
        <BiSolidFileExport className='text-lg mr-2'/>
        <span className='text-lg font-bold'>輸出檔案</span>
      </div>
      <div className='mt-5'>
        <form>
          <div className='flex justify-center'>
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
              <legend className="fieldset-legend">輸出設定</legend>
              <label htmlFor='title' className="label">檔案標題</label>
              <input type='text' id='title'
                     className="input input-sm" {...register('title', {required: true})}/>
              <label htmlFor='piece' className='label'>格式</label>
              <select className="select select-sm" id='piece' {...register('piece')}>
                <option value='2'>一頁 2 張圖片</option>
                <option value='6' disabled>一頁 6 張圖片</option>
              </select>
              {piece === '6' && <span className="label text-error">僅適用全部為手機截圖等直式圖片</span>}
            </fieldset>
          </div>
          <div className='divider'></div>
          <div className='mt-4 flex'>
            <button className='btn btn-success btn-sm mr-auto btn-disabled'>直接列印</button>
            <button className='btn btn-success btn-sm btn-disabled'>
              <FaRegFilePdf/>
              儲存PDF
            </button>
            <button type='button' className='btn btn-success btn-sm ml-2' onClick={handleSaveDocx}>
              <FaRegFileWord/>
              儲存Word
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}