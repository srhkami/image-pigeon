import {Alert, Button, Col, FormInputCol, Row} from "@/component";
import {LuImageDown} from "react-icons/lu";
import {SubmitHandler, useForm} from "react-hook-form";
import {CustomImage, TOutputData} from "@/utils/type.ts";
import {showToast} from "@/utils/handleToast.ts";
import {checkStatus} from "@/utils/handleError.ts";
import {useState} from "react";
import {AlertLoading} from "@/layout";
import {IoMdAlert} from "react-icons/io";

type Props = {
  readonly images: Array<CustomImage>;
}

export default function SaveImages({images}: Props) {

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: {errors}
  } = useForm<TOutputData>({defaultValues: {title: 'Photo', min_size: 1000}});

  const onSave: SubmitHandler<TOutputData> = (formData) => {
    setIsLoading(true);
    showToast(
      async () => {
        const res1 = await window.pywebview.api.select_path({mode: 'images'});
        checkStatus(res1);
        const data: TOutputData = {
          ...formData,
          images: images,
          path: res1.message,
          mode: '1',
          align_vertical: 'top',
          font_size: '12',
        }
        const res2 = await window.pywebview.api.save_images(data);
        checkStatus(res2);
        setIsLoading(false);
      },
      {success: '儲存成功', error: err => err.toString()}
    )
      .finally(() => setIsLoading(false))
  }

  return (
    <Row>
      <Col xs={12}>
        <Alert color='info'>
          <IoMdAlert className='text-lg'/>
          此功能可以儲存經壓縮、排序後的圖片，圖片名稱會以「檔案名稱 + 編號」方式命名。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='檔案名稱' error={errors.title?.message}>
        <input type='text' className="input w-full"
               {...register('title', {required: "此填寫此欄位"})}/>
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
      <Col xs={12} className='mt-6'>
        {isLoading ?
          <AlertLoading count={images.length}/>
          :
          <Button color='success' shape='block'
                  onClick={handleSubmit(onSave)}>
            <LuImageDown/>另存圖片
          </Button>
        }
      </Col>
    </Row>
  )
}