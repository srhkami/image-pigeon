import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {importLongScreen} from "@/services/imageApi.ts";
import {applyImportResult} from "@/state/projectState.ts";
import {ProjectV2} from "@/types/project.ts";
import {applyImportRemarks, toCustomImagesFromImportData} from "@/state/projectImageAdapter.ts";
import {SUPPORTED_IMAGE_FILE_ACCEPT} from "@/features/Upload/fileAccept.ts";

type TFormValue = {
  files: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly project: ProjectV2,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly sessionId: string | null,
  readonly setSessionId: Dispatch<SetStateAction<string | null>>,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly setCount: Dispatch<SetStateAction<number>>,
}

/* 新增長截圖，並傳至後端自動分割，之後提供預覽 */
export default function UploadLongScreen({
  setImages,
  defaultRemark,
  project,
  setProject,
  sessionId,
  setSessionId,
  onHide,
  setIsLoading,
  setCount,
}: Props) {

  const {register, handleSubmit, reset, formState: {errors}} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    showToast(
      async () => {
        setIsLoading(true);
        const files = Array.from(formData.files); //檔案列表
        setCount(files.length); // 設定檔案總數
        let done = 0  // 已完成數量
        let nextProject = project
        let nextSessionId: string | null = sessionId
        const readyImages: CustomImage[] = []

        for (const file of files) {
          const res = await importLongScreen({
            file,
            quality: 75,
            minSize: 1000,
            sessionId: nextSessionId ?? undefined,
          })

          const remarkMode = {
            isFileNameMode: false,
            defaultRemark,
          }
          const importDataWithRemarks = applyImportRemarks(res.data, remarkMode)

          nextProject = applyImportResult(nextProject, importDataWithRemarks)
          readyImages.push(...toCustomImagesFromImportData(importDataWithRemarks, res.data.sessionId, remarkMode))

          done++
          nextSessionId = res.data.sessionId
          window.pywebview.updateProgress(done)
        }

        setProject(nextProject)
        setSessionId(nextSessionId)
        // 加入預覽列表
        setImages(prev => [...prev, ...readyImages]);
        setIsLoading(false);
        reset();
        onHide();
      },
      {
        success: '新增成功',
        error: (err) => String(err),
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
