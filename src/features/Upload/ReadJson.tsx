import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {base64Image, CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";

type TFormValue = {
  files: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
}

/* 讀取JSON檔案 */
export default function ReadJson({setImages, onHide, setIsLoading}: Props) {

  const {register, handleSubmit, formState: {errors}} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    showToast(
      async () => {
        setIsLoading(true);

        const file = formData.files[0];

        if (!file) return;


        const json = await file.text().then(JSON.parse);
        console.log("JSON內容：", json);
        const images = json.images as Array<base64Image>;


        const imageObjs = await Promise.all(
          images.map((item) => CustomImage.fromBase64(item))
        );
        if (!images) {
          throw Error('沒有找到圖片')
        }
        // 更新圖片狀態
        setImages(prev => [...prev, ...imageObjs]);
        setIsLoading(false);
        onHide();
      },
      {
        success: '讀取成功',
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
        <FormInputCol xs={12} label='上傳專用檔案' error={errors.files?.message}>
          <input id='files' type="file" accept=".json" className="file-input w-full"
                 {...register('files', {required: '請上傳檔案'})}/>
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