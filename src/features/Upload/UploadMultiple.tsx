import {SubmitHandler, useForm} from "react-hook-form";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import toast from "react-hot-toast";
import {CustomImage} from "@/utils/type.ts";
import {Button, Col, FormInputCol, Row} from "@/component";
import {showToast} from "@/utils/handleToast.ts";
import {browserAssetStore} from "@/services/browserAssetStore.ts";
import {applyImportResult} from "@/state/projectState.ts";
import {ProjectV2} from "@/types/project.ts";
import {toCustomImagesFromImportData} from "@/state/projectImageAdapter.ts";
import {SUPPORTED_IMAGE_FILE_ACCEPT} from "@/features/Upload/fileAccept.ts";
import {formatImportSummary, importGeneralImages} from "@/features/Upload/browserImportAdapter.ts";
import {throwIfAborted} from "@/services/browserRuntimeContract.ts";

type Props = {
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>,
  readonly defaultRemark: string,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly onHide: () => void,
  readonly setIsLoading: (value: boolean) => void,
  readonly setCount: Dispatch<SetStateAction<number>>,
  readonly pendingFiles?: File[],
  readonly beginImport: () => AbortSignal,
  readonly finishImport: (signal: AbortSignal) => void,
}

export type FromValues = {
  files?: FileList,
  isFileNameMode: boolean,  // 將檔案名當作備註的模式
  min_size: number, // 最小尺寸
  quality: '100' | '90' | '75' | '50', // 壓縮率
}

/* 新增多張圖片 */
export default function UploadMultiple({
                                         setImages,
                                         defaultRemark,
                                         setProject,
                                         onHide,
                                         setIsLoading,
                                         setCount,
                                         pendingFiles = [],
                                         beginImport,
                                         finishImport,
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
    if (value === '100') return 100
    if (value === '50') return 50
    if (value === '75') return 75
    return 90
  }

  const omSubmit: SubmitHandler<FromValues> = async (formData) => {
    const files = selectedFiles

    if (!files.length) {
      setError('files', {type: 'required', message: '請上傳圖片'})
      return
    }

    const signal = beginImport()
    setIsLoading(true)
    const remarkMode = {
      isFileNameMode: formData.isFileNameMode,
      defaultRemark,
    }
    try {
      const importData = await showToast(
        async () => {
        setCount(files.length);
        const quality = parseQuality(formData.quality)
        return await importGeneralImages({
          files,
          quality,
          minSize: formData.min_size,
          remarkMode,
          store: browserAssetStore,
          signal,
          onProgress: completed => setCount(completed),
        })
        },
        {error: (err) => String(err)},
      )
      throwIfAborted(signal)
      const importedImages = toCustomImagesFromImportData(importData, remarkMode)

      setProject(currentProject => applyImportResult(currentProject, importData))

      setImages(prev => [...prev, ...importedImages])
      toast.success(formatImportSummary(importData))
      setSelectedFiles([])
      reset()
      onHide()
    } catch (err) {
      console.log(err)
    } finally {
      finishImport(signal)
      setIsLoading(false)
    }
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
            <option value='100'>不壓縮</option>
          </select>
        </FormInputCol>
        <FormInputCol xs={6} label='壓縮最小尺寸' error={errors.min_size?.message}>
          <select id='min_size' className="select w-full" {...register('min_size', {valueAsNumber: true})}>
            <option value='500'>500 px</option>
            <option value='1000'>1000 px</option>
            <option value='2000'>2000 px</option>
          </select>
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
