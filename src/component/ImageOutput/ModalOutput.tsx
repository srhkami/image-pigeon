import Modal from "../Layout/Modal.tsx";
import {CustomImage} from "../../utils/type.ts";
import {SubmitHandler, useForm} from "react-hook-form";
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
  mode: '2' | '6',
  min_size: number,
  quality: 100 | 90 | 80 | 70,
}

export default function ModalOutput({images, isModalShow, setIsModalShow}: Props) {

  const handleModalHide = () => setIsModalShow(false);
  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<TFormValue>({defaultValues: {title: '刑案照片黏貼表', min_size: 1000}});

  const handleSaveDocx: SubmitHandler<TFormValue> = (formData) => {
    toast.loading('處理中，請稍候...')
    const data = {
      ...formData,
      images: images,
    }
    window.pywebview.api.save_docx(data)
      .then(res => {
        toast.dismiss();
        if (res.status == 200) {
          setIsModalShow(false);
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
                     className="input input-sm" {...register('title', {required: "此欄位必填"})}/>
              {errors.title && <span className="text-xs text-error text-start">{errors.title.message}</span>}
              <label htmlFor='mode' className='label'>排版</label>
              <select className="select select-sm" id='mode' {...register('mode')}>
                <option value='1'>一頁 2 張(上下排佈，適用橫式圖片)</option>
                <option value='2'>一頁 2 張(左右排佈，適用直式圖片)</option>
                <option value='6'>一頁 6 張(適用直式圖片)</option>
              </select>
              <label htmlFor='min_size' className="label">圖片壓縮最小尺寸</label>
              <input type='number' id='min_size'
                     className="input input-sm" {...register('min_size', {
                required: '此欄位必填',
                min: {value: 500, message: '最小值為500'},
              })}/>
              {errors.min_size && <span className="text-xs text-error text-start">{errors.min_size.message}</span>}
              <label htmlFor='quality' className='label'>壓縮率</label>
              <select className="select select-sm" id='quality' defaultValue='80' {...register('quality')}>
                <option value='90'>低（90%）</option>
                <option value='80'>中（80%）</option>
                <option value='70'>高（70%）</option>
                <option value='100'>不壓縮</option>
              </select>
            </fieldset>
          </div>
          <div className='divider'></div>
          <div className='mt-4 flex'>
            <button className='btn btn-success btn-sm mr-auto btn-disabled'>直接列印</button>
            <button className='btn btn-success btn-sm btn-disabled'>
              <FaRegFilePdf/>
              儲存PDF
            </button>
            <button type='button' className='btn btn-success btn-sm ml-2' onClick={handleSubmit(handleSaveDocx)}>
              <FaRegFileWord/>
              儲存Word
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}