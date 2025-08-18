import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {checkStatus} from "@/utils/handleError.ts";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly setCount: Dispatch<SetStateAction<number>>,
}

export type FromValues = {
  files: Array<File>,
  isFileNameMode: boolean,  // 將檔案名當作備註的模式
  isNotCompress: boolean,  // 不壓縮
  min_size: number, // 最小尺寸
  quality: '90' | '75' | '50', // 壓縮率
}

/* 新增多張圖片 */
export default function UploadMultiple({setImages, defaultRemark, onHide, setIsLoading, setCount}: Props) {

  const {register, handleSubmit, reset, watch, formState: {errors}}
    = useForm<FromValues>({defaultValues: {min_size: 1000}});

  const isNotCompress = watch('isNotCompress')

  const omSubmit: SubmitHandler<FromValues> = (formData) => {
    showToast(
      async () => {
        setIsLoading(true);
        const files = Array.from(formData.files);
        setCount(files.length);
        const filesNames = files.map(file => file.name)
        // 將每個檔案轉換成 CustomImage
        const imageInstances = files.map(file => {
          const remark = formData.isFileNameMode ? file.name : defaultRemark;
          return new CustomImage(file, remark)
        });
        // 逐一等待 base64 等欄位初始化完成
        let readyImages = await Promise.all(imageInstances.map(img => img.init()));
        if (!isNotCompress) {
          // 將初始化完成的圖片傳給後端
          const res = await window.pywebview.api.upload_image({
            files: readyImages,
            min_size: formData.min_size,
            quality: formData.quality,
          });
          checkStatus(res);
          readyImages = await Promise.all(
            res.data.map((item, index) =>
              CustomImage.fromBase64({
                ...item,
                remark: formData.isFileNameMode ? filesNames[index] : defaultRemark
              })
            )
          )
        }
        // 更新圖片狀態
        setImages(prev => [...prev, ...readyImages]);
        setIsLoading(false);
        reset();
        onHide();
      },
      {success: '新增成功',}
    )
      .catch(err => console.log(err))
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <Row>
        <FormInputCol xs={12} label='上傳多張圖片' error={errors.files?.message}>
          <input id='files' type="file"
                 multiple accept=".jpg,.jpeg,.png,.jfif,.bmp" className="file-input w-full"
                 {...register('files', {required: '請上傳圖片'})}/>
        </FormInputCol>
        <Col xs={12} className='divider mt-3 mb-1'>
        </Col>
        <FormInputCol xs={6} label='圖片壓縮品質' error={errors.quality?.message}>
          <select className="select w-full" id='quality' defaultValue='75' disabled={isNotCompress}
                  {...register('quality')}>
            <option value='50'>較低</option>
            <option value='75'>預設</option>
            <option value='90'>較高</option>
          </select>
        </FormInputCol>
        <FormInputCol xs={6} label='壓縮最小尺寸' error={errors.min_size?.message}>
          <input type='number' id='min_size' className="input w-full" disabled={isNotCompress}
                 {...register('min_size', {
                   required: '此填寫此欄位',
                   min: {value: 500, message: '不得低於500'},
                 })}/>
        </FormInputCol>
        <Col xs={12} className='mt-3 px-1'>
          <label className="label">
            <input type="checkbox" className="checkbox"
                   {...register('isNotCompress')}/>
            不壓縮圖片（能更快匯入，但無法節省空間）
          </label>
        </Col>
        <Col xs={12} className='mt-3 px-1'>
          <label className="label">
            <input type="checkbox" className="checkbox"
                   {...register('isFileNameMode')}/>
            使用檔名作為每張圖片的備註，不套用預設備註
          </label>
        </Col>
        <Col xs={12} className='mt-4'>
          <Button color='primary' shape='block'>
            新增
          </Button>
        </Col>
      </Row>
    </form>
  )
}