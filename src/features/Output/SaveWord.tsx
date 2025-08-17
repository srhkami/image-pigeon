import {Alert, Button, Col, FormInputCol, Row} from "@/component";
import {SubmitHandler, useForm} from "react-hook-form";
import {CustomImage, OutputWord} from "@/utils/type.ts";
import {showToast} from "@/utils/handleToast.ts";
import {checkStatus} from "@/utils/handleError.ts";
import {useState} from "react";
import {AlertLoading} from "@/layout";
import {FaRegFileWord} from "react-icons/fa6";
import {IoMdAlert} from "react-icons/io";

type Props = {
  readonly images: Array<CustomImage>;
}

export default function SaveWord({images}: Props) {

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<OutputWord>({defaultValues: {title: '照片黏貼表'}});

  const onSave: SubmitHandler<OutputWord> = (formData) => {
    setIsLoading(true);
    showToast(
      async () => {
        const res1 = await window.pywebview.api.select_path({mode: 'word', title: formData.title});
        checkStatus(res1);
        const data: OutputWord = {
          ...formData,
          images: images,
          path: res1.message,
        }
        const res2 = await window.pywebview.api.save_docx(data);
        checkStatus(res2);
      },
      {success: '儲存成功', error: (err => err.toString())}
    )
      .finally(() => setIsLoading(false))
  }


  return (
    <Row>
      <Col xs={12}>
        <Alert color='info'>
          <IoMdAlert className='text-lg'/>
          此功能可儲存WORD文件，便於使用者保存、分享及編輯。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='文件標題 / 檔案名稱' error={errors.title?.message}>
        <input type='text' className="input w-full"
               {...register('title', {required: "此填寫此欄位"})}/>
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
      <FormInputCol xs={12} label='排版' error={errors.mode?.message}>
        <select className="select w-full"
                {...register('mode', {required: '請選擇此欄位'})}>
          <option value=''>請選擇</option>
          <option value='1'>一頁 2 張（上下排佈，適用橫式圖片）</option>
          <option value='2'>一頁 2 張（左右排佈，適用直式圖片）</option>
          <option value='6'>一頁 6 張（適用直式圖片)</option>
        </select>
      </FormInputCol>
      <Col xs={12} className='mt-6'>
        {isLoading ?
          <AlertLoading count={images.length}/>
          :
          <Button color='success' shape='block'
                  onClick={handleSubmit(onSave)}>
            <FaRegFileWord/>
            儲存Word
          </Button>
        }
      </Col>
    </Row>
  )
}