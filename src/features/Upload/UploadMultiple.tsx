import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {base64Image, CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {IoAlertCircleOutline} from "react-icons/io5";
import {checkStatus} from "@/utils/handleError.ts";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
}

export type FromValues = {
  files: Array<File>,
  isFileNameMode: boolean;
  min_size: number, // 最小尺寸
  quality: '100' | '90' | '80' | '70', // 壓縮率
}

/* 新增多張圖片 */
export default function UploadMultiple({setImages, defaultRemark, onHide, setIsLoading}: Props) {

  const {register, handleSubmit, reset, formState: {errors}}
    = useForm<FromValues>({defaultValues: {min_size: 1000}});

  const omSubmit: SubmitHandler<FromValues> = (formData) => {
    showToast(
      async () => {
        setIsLoading(true);
        const files = Array.from(formData.files);
        const filesNames = files.map(file => file.name)
        // 將每個檔案轉換成 CustomImage
        const imageInstances = files.map(file => {
          const remark = formData.isFileNameMode ? file.name : defaultRemark;
          return new CustomImage(file, remark)
        });
        // 逐一等待 base64 等欄位初始化完成
        const readyImages = await Promise.all(imageInstances.map(img => img.init()));
        // 將初始化完成的圖片傳給後端
        const res = await window.pywebview.api.upload_image({
          files: readyImages,
          min_size: formData.min_size,
          quality: formData.quality,
        });
        checkStatus(res);
        const imageObjs = await Promise.all(
          res.data.map((imgData: base64Image, index) => CustomImage.fromBase64(imgData, formData.isFileNameMode ? filesNames[index] : defaultRemark))
        );
        // 更新圖片狀態
        setImages(prev => [...prev, ...imageObjs]);
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
          <div className='flex items-center opacity-60'>
            <IoAlertCircleOutline className='text-lg mr-2'/>
            <span className='text-sm'>
                  從後往前選取能保證圖片順序正確
                </span>

          </div>
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
        <Col xs={12} className='mt-3 px-1'>
          <label className="label">
            <input type="checkbox" className="checkbox"
                   {...register('isFileNameMode')}/>
            使用檔名當作每張圖片的備註，不套用預設備註
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