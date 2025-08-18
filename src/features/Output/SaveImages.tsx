import {Alert, Button, Col, FormInputCol, Row} from "@/component";
import {LuImageDown} from "react-icons/lu";
import {SubmitHandler, useForm} from "react-hook-form";
import {CustomImage, SaveAsImages} from "@/utils/type.ts";
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
    watch,
    formState: {errors}
  } = useForm<SaveAsImages>({defaultValues: {title: 'Photo'}});

  const isRemarkMode = watch('is_remark_mode')
  const onSave: SubmitHandler<SaveAsImages> = (formData) => {
    setIsLoading(true);
    showToast(
      async () => {
        const res1 = await window.pywebview.api.select_path({mode: 'images'});
        checkStatus(res1);
        const data: SaveAsImages = {
          ...formData,
          images: images,
          path: res1.message,
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
          此功能可以儲存經壓縮、排序後的圖片，圖片名稱會以「預設名稱 + 編號」方式命名。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='預設名稱' error={errors.title?.message}>
        <input type='text' className="input w-full" disabled={isRemarkMode}
               {...register('title', {required: "此填寫此欄位"})}/>
        <label className="label mt-2 text-sm">
          <input type="checkbox" className="checkbox"
                 {...register('is_remark_mode')}/>
          將每張圖片的備註當作檔名儲存
        </label>
        {isRemarkMode &&
          <Alert color='warning'>
            <IoMdAlert className='text-lg'/>
            請注意備註不得重複否則將無法順利儲存、換行會以「底線 _ 」取代
          </Alert>
        }
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