import Modal from "../Layout/Modal.tsx";
import {CustomImage, TOutputData} from "../../utils/type.ts";
import {SubmitHandler, useForm} from "react-hook-form";
import {BiSolidFileExport} from "react-icons/bi";
import toast from "react-hot-toast";
import {FaRegFileWord, FaRegFilePdf} from "react-icons/fa6";
import {FormEvent, useState} from "react";
import AlertLoading from "../Layout/AlertLoading.tsx";
import {checkStatus} from "../../utils/handleError.ts";

type Props = {
  readonly images: CustomImage[],
  readonly isModalShow: boolean,
  readonly setIsModalShow: (value: boolean) => void,
}

export default function ModalOutput({images, isModalShow, setIsModalShow}: Props) {

  const [isLoading, setIsLoading] = useState(false); // 載中入狀態，要禁止按鈕

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<TOutputData>({defaultValues: {title: '照片黏貼表', min_size: 1000}});

  const handleModalHide = () => setIsModalShow(false);


  const handleSaveDocx: SubmitHandler<TOutputData> = async (formData) => {
    try {
      const res1 = await window.pywebview.api.select_path({mode: 'word', title: formData.title});
      checkStatus(res1);
      toast.loading('儲存中，請稍候...');
      setIsLoading(true);
      const data = {
        ...formData,
        images: images,
        path: res1.message
      }
      const res2 = await window.pywebview.api.save_docx(data);
      checkStatus(res2);
      setIsLoading(false);
      setIsModalShow(false);
      toast.dismiss();
      toast.success(res2.message);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      throw error;
    }
  }

  const handleSaveImages: SubmitHandler<TOutputData> = async (formData) => {
    try {
      const res1 = await window.pywebview.api.select_path({mode: 'images'});
      checkStatus(res1);
      toast.loading('儲存中，請稍候...');
      setIsLoading(true);
      const data = {
        ...formData,
        images: images,
        path: res1.message
      }
      const res2 = await window.pywebview.api.save_images(data);
      checkStatus(res2);
      setIsLoading(false);
      setIsModalShow(false);
      toast.dismiss();
      toast.success(res2.message);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
      throw error
    }
  }

  const nothing = (e: FormEvent<HTMLFormElement>) => e.preventDefault();

  return (
    <Modal isShow={isModalShow} onHide={handleModalHide} closeButton>
      <div className='flex justify-center items-center'>
        <BiSolidFileExport className='text-lg mr-2'/>
        <span className='text-lg font-bold'>輸出檔案</span>
      </div>
      <div className='mt-5'>
        <form onSubmit={(e) => nothing(e)}>
          <div className='flex justify-center'>
            <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
              <legend className="fieldset-legend">輸出設定</legend>
              <label htmlFor='title' className="label">檔案標題</label>
              <input type='text' id='title'
                     className="input input-sm" {...register('title', {required: "此欄位必填"})}/>
              {errors.title && <span className="text-xs text-error text-start">{errors.title.message}</span>}
              <label htmlFor='mode' className='label mt-2'>排版</label>
              <select className="select select-sm" id='mode' {...register('mode')}>
                <option value='1'>一頁 2 張(上下排佈，適用橫式圖片)</option>
                <option value='2'>一頁 2 張(左右排佈，適用直式圖片)</option>
                <option value='6'>一頁 6 張(適用直式圖片)</option>
              </select>
              <div className='flex mt-2'>
                <div className='flex-1/2 pr-1'>
                  <label htmlFor='align_vertical' className='label w-full'>說明文字對齊</label>
                  <select className="select select-sm" id='align_vertical'
                          defaultValue='center' {...register('align_vertical')}>
                    <option value='top'>垂直置頂</option>
                    <option value='center'>垂直置中</option>
                  </select>
                </div>
                <div className='flex-1/2 pl-1'>
                  <label htmlFor='font_size' className='label w-full'>字體大小</label>
                  <select className="select select-sm" id='font_size' defaultValue='12' {...register('font_size')}>
                    <option value='10'>小（10）</option>
                    <option value='11'>偏小（11）</option>
                    <option value='12'>普通（12）</option>
                    <option value='13'>偏大（13）</option>
                    <option value='14'>大（14）</option>
                  </select>
                </div>
              </div>
              <div className='flex mt-2'>
                <div className='flex-1/2 pr-1'>
                  <label htmlFor='quality' className='label w-full'>圖片壓縮率</label>
                  <select className="select select-sm" id='quality' defaultValue='80' {...register('quality')}>
                    <option value='90'>低（90%）</option>
                    <option value='80'>中（80%）</option>
                    <option value='70'>高（70%）</option>
                    <option value='100'>不壓縮</option>
                  </select>
                </div>
                <div className='flex-1/2 pl-1'>
                  <label htmlFor='min_size' className="label w-full">壓縮最小尺寸</label>
                  <input type='number' id='min_size'
                         className="input input-sm" {...register('min_size', {
                    required: '此欄位必填',
                    min: {value: 500, message: '不得低於500'},
                  })}/>
                  {errors.min_size &&
                    <div className="text-xs text-error text-start w-full">{errors.min_size.message}</div>}
                </div>
              </div>

            </fieldset>
          </div>
          <div className='divider'></div>
          {isLoading ?
            <AlertLoading/>
            :
            <div className='mt-4 flex'>
              <button type='button' className='btn btn-accent btn-sm mr-auto'
                      onClick={handleSubmit(handleSaveImages)}>
                另存圖片
              </button>
              <button className='btn btn-success btn-sm btn-disabled'>
                <FaRegFilePdf/>
                儲存PDF
              </button>
              <button type='button' className='btn btn-success btn-sm ml-2 '
                      onClick={handleSubmit(handleSaveDocx)}>
                <FaRegFileWord/>
                儲存Word
              </button>
            </div>
          }
        </form>
      </div>
    </Modal>
  )
}