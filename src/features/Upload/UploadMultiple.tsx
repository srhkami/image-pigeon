import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {importImages} from "@/services/imageApi.ts";
import {applyImportResult} from "@/state/projectState.ts";
import {ProjectV2} from "@/types/project.ts";
import {applyImportRemarks, toCustomImagesFromImportData} from "@/state/projectImageAdapter.ts";
import {SUPPORTED_IMAGE_FILE_ACCEPT} from "@/features/Upload/fileAccept.ts";
import {notifyOptionalProgress} from "@/features/Upload/externalImageDrop.ts";

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
  readonly pendingFiles?: File[],
}

export type FromValues = {
  files?: FileList,
  isFileNameMode: boolean,  // 將檔案名當作備註的模式
  min_size: number, // 最小尺寸
  quality: '90' | '75' | '50', // 壓縮率
}

/* 新增多張圖片 */
export default function UploadMultiple({
                                         setImages,
                                         defaultRemark,
                                         project,
                                         setProject,
                                         sessionId,
                                         setSessionId,
                                         onHide,
                                         setIsLoading,
                                         setCount,
                                         pendingFiles = [],
                                       }: Props) {

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: {errors}
  } = useForm<FromValues>({defaultValues: {min_size: 1000}});
  const [selectedFiles, setSelectedFiles] = useState<File[]>(pendingFiles)

  useEffect(() => {
    setSelectedFiles(pendingFiles)
  }, [pendingFiles])

  const parseQuality = (value: FromValues['quality']) => {
    if (value === '50') return 50
    if (value === '75') return 75
    return 90
  }

  const omSubmit: SubmitHandler<FromValues> = async (formData) => {
    const batchSize = 3
    const files = selectedFiles

    if (!files.length) {
      setError('files', {type: 'required', message: '請上傳圖片'})
      return
    }

    showToast(
      async () => {
        setIsLoading(true);
        setCount(files.length);
        let done = 0  // 已完成數量
        let nextProject = project
        let nextSessionId: string | null = sessionId

        const quality = parseQuality(formData.quality)
        const importedImages: Array<CustomImage> = []

        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize)

          const res = await importImages({
            files: batch,
            quality,
            minSize: formData.min_size,
            sessionId: nextSessionId ?? undefined,
          })

          const remarkMode = {
            isFileNameMode: formData.isFileNameMode,
            defaultRemark,
          }
          const importDataWithRemarks = applyImportRemarks(res.data, remarkMode)

          nextProject = applyImportResult(nextProject, importDataWithRemarks)

          const adapted = toCustomImagesFromImportData(importDataWithRemarks, res.data.sessionId, remarkMode)

          importedImages.push(...adapted)

          const currentBatchDone = Math.max(res.data.items.length, batch.length)
          done += currentBatchDone
          nextSessionId = res.data.sessionId
          notifyOptionalProgress(window.pywebview, done)
        }

        setProject(nextProject)
        setSessionId(nextSessionId)

        // 更新圖片狀態
        setImages(prev => [...prev, ...importedImages])
        // 重置
        setIsLoading(false);
        setSelectedFiles([])
        reset();
        onHide();
      },
      {success: '新增成功',}
    )
      .catch(err => {
        console.log(err)
        setIsLoading(false)
      })
  }

  const filesRegistration = register('files')

  return (
    <form onSubmit={handleSubmit(omSubmit)}>
      <Row>
        <FormInputCol xs={12} label='請選擇要導入的圖片（可多選）' error={errors.files?.message}>
          <input id='files' type="file"
                 multiple accept={SUPPORTED_IMAGE_FILE_ACCEPT} className="file-input w-full"
                 {...filesRegistration}
                 onChange={event => {
                   filesRegistration.onChange(event)
                   setSelectedFiles(Array.from(event.target.files ?? []))
                 }}/>
        </FormInputCol>
        {selectedFiles.length > 0 && (
              <div className='font-bold text-info text-sm mt-1'>
                已選擇 {selectedFiles.length} 張圖片
              </div>
        )}
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
