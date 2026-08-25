import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import toast from "react-hot-toast";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {browserAssetStore} from "@/services/browserAssetStore.ts";
import {applyImportResult} from "@/state/projectState.ts";
import {ProjectV2} from "@/types/project.ts";
import {toCustomImagesFromImportData} from "@/state/projectImageAdapter.ts";
import {SUPPORTED_IMAGE_FILE_ACCEPT} from "@/features/Upload/fileAccept.ts";
import {formatImportSummary, importLongScreens} from "@/features/Upload/browserImportAdapter.ts";
import {throwIfAborted} from "@/services/browserRuntimeContract.ts";

type TFormValue = {
  files: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly setCount: Dispatch<SetStateAction<number>>,
  readonly beginImport: () => AbortSignal,
  readonly finishImport: (signal: AbortSignal) => void,
}

/* 新增長截圖，並傳至後端自動分割，之後提供預覽 */
export default function UploadLongScreen({
  setImages,
  defaultRemark,
  setProject,
  onHide,
  setIsLoading,
  setCount,
  beginImport,
  finishImport,
}: Props) {

  const {register, handleSubmit, reset, formState: {errors}} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    const signal = beginImport()
    setIsLoading(true)
    try {
      const importData = await showToast(
        async () => {
        const files = Array.from(formData.files); //檔案列表
        setCount(files.length); // 設定檔案總數
        return await importLongScreens({
          files,
          quality: 75,
          minSize: 1000,
          defaultRemark,
          store: browserAssetStore,
          signal,
          onProgress: completed => setCount(completed),
        })
        },
        {error: (err) => String(err)},
      )
      throwIfAborted(signal)
      const remarkMode = {isFileNameMode: false, defaultRemark}
      const readyImages = toCustomImagesFromImportData(importData, remarkMode)

      setProject(currentProject => applyImportResult(currentProject, importData))
      setImages(prev => [...prev, ...readyImages])
      toast.success(formatImportSummary(importData))
      reset()
      onHide()
    } catch (err) {
      console.log(err)
    } finally {
      finishImport(signal)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <Row>
        <FormInputCol xs={12} label='請選擇要導入的長截圖（可多選）' error={errors.files?.message}>
          <input id='id_image' type="file" accept={SUPPORTED_IMAGE_FILE_ACCEPT} className="file-input w-full" multiple
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
