import {Alert, Button, Col, FormInputCol, Row} from "@/component";
import {SubmitHandler, useForm} from "react-hook-form";
import {CustomImage, OutputBaseData} from "@/utils/type.ts";
import {showToast} from "@/utils/handleToast.ts";
import {checkStatus} from "@/utils/handleError.ts";
import {useState} from "react";
import {AlertLoading} from "@/layout";
import {FaRegFileWord} from "react-icons/fa6";
import {IoMdAlert} from "react-icons/io";

type Props = {
  readonly images: Array<CustomImage>;
}

export default function SaveJson({images}: Props) {

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<OutputBaseData>({defaultValues: {title: '照片黏貼表-貼圖小鴿手'}});

  const onSave: SubmitHandler<OutputBaseData> = (formData) => {
    setIsLoading(true);
    showToast(
      async () => {
        const res1 = await window.pywebview.api.select_path({mode: 'json', title: formData.title});
        checkStatus(res1);
        const data: OutputBaseData = {
          ...formData,
          images: images,
          path: res1.message,
        }
        const res2 = await window.pywebview.api.save_json(data);
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
          此功能可另存成「貼圖小鴿手」專用的檔案，儲存所有匯入、處理過的圖片，在任何時候重新讀取編輯。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='檔案名稱' error={errors.title?.message}>
        <input type='text' className="input w-full"
               {...register('title', {required: "此填寫此欄位"})}/>
      </FormInputCol>
      <Col xs={12} className='mt-6'>
        {isLoading ?
          <AlertLoading/>
          :
          <Button color='success' shape='block'
                  onClick={handleSubmit(onSave)}>
            <FaRegFileWord/>
            儲存檔案
          </Button>
        }
      </Col>
    </Row>
  )
}