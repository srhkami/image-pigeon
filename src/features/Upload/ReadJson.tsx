import {useForm} from "react-hook-form";
import {Dispatch, SetStateAction} from "react";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {LEGACY_JSON_FILE_ACCEPT} from "@/features/Upload/fileAccept.ts";
import {ProjectV2} from '@/types/project.ts'
import {migrateLegacyProjectJson} from '@/services/browserProjectArchive.ts'
import {browserImageProcessor} from '@/services/browserImageProcessor.ts'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {toCustomImagesFromProject} from '@/state/projectImageAdapter.ts'
import {BROWSER_RUNTIME_LIMITS, BrowserOperationError} from '@/services/browserRuntimeContract.ts'
import {browserProjectOperationCoordinator} from '@/services/browserProjectOperation.ts'

type TFormValue = {
  files: FileList,
}

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly beginImport: () => AbortSignal,
  readonly finishImport: (signal: AbortSignal) => void,
}

/* 讀取JSON檔案 */
export default function ReadJson({setImages, setProject, onHide, setIsLoading, beginImport, finishImport}: Props) {

  const {register, handleSubmit, formState: {errors}} = useForm<TFormValue>();

  const omSubmit = async (formData: TFormValue) => {
    const ownerSignal = beginImport()
    const lease = browserProjectOperationCoordinator.begin(ownerSignal)
    showToast(
      async () => {
        setIsLoading(true);

        const file = formData.files[0];

        if (!file) throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', '請選擇 1.x JSON 檔案');
        if (file.size > BROWSER_RUNTIME_LIMITS.legacyJson.maxFileBytes) {
          throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `1.x JSON 不得超過 ${BROWSER_RUNTIME_LIMITS.legacyJson.maxFileBytes} bytes`)
        }

        const migrated = await migrateLegacyProjectJson(await file.text(), {
          process: browserImageProcessor.processLegacyImage,
        }, lease.signal)
        lease.assertCurrent()
        browserAssetStore.replaceAll(migrated.assets)
        setProject(migrated.project)
        setImages(() => toCustomImagesFromProject(migrated.project, ''))
        onHide();
      },
      {
        success: '讀取成功',
        error: (err) => String(err),
      }
    ).finally(() => {
      lease.finish()
      finishImport(ownerSignal)
      setIsLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <Row>
        <FormInputCol xs={12} label='支援 1.X 版本之貼圖小鴿手專用存檔' error={errors.files?.message}>
          <input id='files' type="file" accept={LEGACY_JSON_FILE_ACCEPT} className="file-input w-full"
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