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
  min_size: number, // 最小尺寸
  quality: '90' | '75' | '50', // 壓縮率
}

/**
 * 將檔案轉成base64
 * @param file 檔案
 */
async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  // 將 ArrayBuffer → base64（節省 dataURL 頭）
  let binary = ''
  const bytes = new Uint8Array(buf)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

/* 新增多張圖片 */
export default function UploadMultiple({setImages, defaultRemark, onHide, setIsLoading, setCount}: Props) {

  const {register, handleSubmit, reset, formState: {errors}}
    = useForm<FromValues>({defaultValues: {min_size: 1000}});

  const omSubmit: SubmitHandler<FromValues> = (formData) => {

    showToast(
      async () => {
        setIsLoading(true);
        const files = Array.from(formData.files); //檔案列表
        const filesNames = files.map(file => file.name)  // 檔名列表
        setCount(files.length);
        let done = 0  // 已完成數量
        const newImages = await Promise.all(
          files.map(async (file, index) => {
            // 轉換成base64檔，並傳到後端處理
            const base64 = await fileToBase64(file);
            const res = await window.pywebview.api.upload_image({
              file: base64,
              min_size: formData.min_size,
              quality: formData.quality,
            })
            checkStatus(res);
            // 將後端傳回的檔案轉換成自訂圖片物件
            const readyImage = await CustomImage.fromBase64({
              ...res.data,
              remark: formData.isFileNameMode ? filesNames[index] : defaultRemark
            })
            // 增加進度條
            done++;
            window.pywebview.updateProgress(done)
            return readyImage
          })
        )
        // 更新圖片狀態
        setImages(prev => [...prev, ...newImages])
        // 重置
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
          <select className="select w-full" id='quality' defaultValue='75'
                  {...register('quality')}>
            <option value='50'>較低</option>
            <option value='75'>預設</option>
            <option value='90'>較高</option>
          </select>
        </FormInputCol>
        <FormInputCol xs={6} label='壓縮最小尺寸' error={errors.min_size?.message}>
          <input type='number' id='min_size' className="input w-full"
                 {...register('min_size', {
                   required: '此填寫此欄位',
                   min: {value: 500, message: '不得低於500'},
                 })}/>
        </FormInputCol>
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