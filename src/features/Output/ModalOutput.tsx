import {CustomImage, TOutputData} from "@/utils/type.ts";
import {SubmitHandler, useForm} from "react-hook-form";
import {BiSolidFileExport} from "react-icons/bi";
import toast from "react-hot-toast";
import {FaRegFileWord} from "react-icons/fa6";
import {useState} from "react";
import AlertLoading from "../../layout/AlertLoading.tsx";
import {checkStatus} from "@/utils/handleError.ts";
import {Modal} from "@/component/index.ts";
import {Button, FormInputCol, ModalBody, Row} from "@/component";
import { LuImageDown } from "react-icons/lu";

type Props = {
  readonly images: CustomImage[],
}

export default function ModalOutput({images}: Props) {

  const [isShow, setIsShow] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // 載中入狀態，要禁止按鈕

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<TOutputData>({defaultValues: {title: '照片黏貼表', min_size: 1000}});

  // const handleModalHide = () => setIsModalShow(false);

  const handleSaveDocx: SubmitHandler<TOutputData> = (formData) => {
    toast.promise(
      async () => {
        try {
          const res1 = await window.pywebview.api.select_path({mode: 'word', title: formData.title});
          checkStatus(res1);
          setIsLoading(true);
          const data = {
            ...formData,
            images: images,
            path: res1.message
          }
          const res2 = await window.pywebview.api.save_docx(data);
          checkStatus(res2);
          setIsLoading(false);
          setIsShow(false);
        } catch (error) {
          setIsLoading(false);
          throw error;
        }
      },
      {
        loading: '儲存中...',
        success: '儲存成功',
        error: (err) => `${err.toString()}`,
      })
  }

  const handleSaveImages: SubmitHandler<TOutputData> = (formData) => {
    toast.promise(
      async () => {
        try {
          const res1 = await window.pywebview.api.select_path({mode: 'images'});
          checkStatus(res1);
          setIsLoading(true);
          const data = {
            ...formData,
            images: images,
            path: res1.message
          }
          const res2 = await window.pywebview.api.save_images(data);
          checkStatus(res2);
          setIsLoading(false);
          setIsShow(false);
        } catch (error) {
          setIsLoading(false);
          throw error
        }
      }, {
        loading: '儲存中...',
        success: '儲存成功',
        error: (err) => `${err.toString()}`,
      }
    )
  }


  return (
    <>
      <Button color='success' disabled={images.length === 0}
              onClick={() => setIsShow(true)}>
        <BiSolidFileExport/>
        輸出檔案
      </Button>
      <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
        <ModalBody>
          <div className='flex justify-center items-center'>
            <BiSolidFileExport className='text-lg mr-2'/>
            <span className='text-lg font-bold'>輸出檔案</span>
          </div>
          <Row>
            <FormInputCol xs={12} label='檔案標題' error={errors.title?.message}>
              <input type='text' className="input w-full"
                     {...register('title', {required: "此填寫此欄位"})}/>
            </FormInputCol>
            <FormInputCol xs={12} label='排版' error={errors.mode?.message}>
              <select className="select w-full"
                      {...register('mode', {required: '請選擇此欄位'})}>
                <option value=''>請選擇</option>
                <option value='1'>一頁 2 張（上下排佈，適用橫式圖片）</option>
                <option value='2'>一頁 2 張（左右排佈，適用直式圖片）</option>
                <option value='6'>一頁 6 張（適用直式圖片)</option>
              </select>
            </FormInputCol>
            <FormInputCol xs={6} label='說明文字對齊' error={errors.align_vertical?.message}>
              <select className="select w-full" id='align_vertical'
                      defaultValue='center' {...register('align_vertical')}>
                <option value='top'>垂直置頂</option>
                <option value='center'>垂直置中</option>
              </select>
            </FormInputCol>
            <FormInputCol xs={6} label='字體大小' error={errors.font_size?.message}>
              <select className="select w-full" id='font_size' defaultValue='12'
                      {...register('font_size')}>
                <option value='10'>小（10）</option>
                <option value='11'>偏小（11）</option>
                <option value='12'>普通（12）</option>
                <option value='13'>偏大（13）</option>
                <option value='14'>大（14）</option>
              </select>
            </FormInputCol>
            <FormInputCol xs={6} label='圖片壓縮率' error={errors.quality?.message}>
              <select className="select w-full" id='quality' defaultValue='80' {...register('quality')}>
                <option value='90'>低（90%）</option>
                <option value='80'>中（80%）</option>
                <option value='70'>高（70%）</option>
                <option value='100'>不壓縮</option>
              </select>
            </FormInputCol>
            <FormInputCol xs={6} label='壓縮最小尺寸' error={errors.min_size?.message}>
              <input type='number' id='min_size'
                     className="input w-full" {...register('min_size', {
                required: '此填寫此欄位',
                min: {value: 500, message: '不得低於500'},
              })}/>
            </FormInputCol>
          </Row>
          <div className='divider'></div>
          {isLoading ?
            <AlertLoading/>
            :
            <div className='mt-4 flex'>
              <Button color='accent' className='mr-auto'
                      onClick={handleSubmit(handleSaveImages)}>
                <LuImageDown />另存圖片
              </Button>
              {/*<button className='btn btn-success btn-sm btn-disabled'>*/}
              {/*  <FaRegFilePdf/>*/}
              {/*  儲存PDF*/}
              {/*</button>*/}
              <Button color='success'
                      onClick={handleSubmit(handleSaveDocx)}>
                <FaRegFileWord/>
                儲存Word
              </Button>
            </div>
          }
        </ModalBody>
      </Modal>
    </>
  )
}