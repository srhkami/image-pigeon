import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {base64Image, CustomImage} from "@/utils/type.ts";
import {checkStatus} from "@/utils/handleError.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {fileToBase64} from "@/features/Upload/base64.ts";

type TFormValue = {
  files: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly setCount: Dispatch<SetStateAction<number>>,
}

/* 新增長截圖，並傳至後端自動分割，之後提供預覽 */
export default function UploadLongScreen({setImages, defaultRemark, onHide, setIsLoading, setCount}: Props) {

  const {register, handleSubmit, reset, formState: {errors}} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    showToast(
      async () => {
        setIsLoading(true);
        const files = Array.from(formData.files); //檔案列表
        setCount(files.length); // 設定檔案總數
        let done = 0  // 已完成數量

        const resData = await Promise.all(
          files.map(async (file) => {
            // 轉換成base64檔，並傳到後端處理
            const base64 = await fileToBase64(file);
            const res = await window.pywebview.api.crop_image({
              file: base64,
              min_size: 1000,
              quality: "75",
            })
            checkStatus(res);
            // 增加進度條
            done++;
            window.pywebview.updateProgress(done)
            return res.data
          })
        )
        // 將base64圖片的雙重清單解開
        let baseImages: Array<base64Image> = []
        resData.forEach(item => {
          baseImages = [...baseImages, ...item]
        })
        // 將base64圖片清單轉化為自訂圖片清單
        const readyImages = await Promise.all(
          baseImages.map(item => CustomImage.fromBase64({...item, remark: defaultRemark}))
        )
        // 加入預覽列表
        setImages(prev => [...prev, ...readyImages]);
        setIsLoading(false);
        reset();
        onHide();
      },
      {
        success: '新增成功',
        error: (err) => err.toString(),
      }
    ).catch(err => {
      console.log(err);
      setIsLoading(false);
    })
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <Row>
        <FormInputCol xs={12} label='請選擇要導入的長截圖（可多選）' error={errors.files?.message}>
          <input id='id_image' type="file" accept=".jpg,.jpeg,.png" className="file-input w-full" multiple
                 {...register('files', {required: '請上傳圖片'})}/>
        </FormInputCol>
        <Col xs={12} className='mt-6'>
          <Button color='primary' shape='block'>
            新增
          </Button>
        </Col>
      </Row>
    </form>
  )
}