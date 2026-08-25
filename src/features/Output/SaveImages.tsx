import {useEffect, useRef, useState} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {IoMdAlert} from 'react-icons/io'
import {LuImageDown} from 'react-icons/lu'

import {Alert, Button, Col, FormInputCol, Row} from '@/component'
import {createImageExportZip, normalizeImageExportFilename} from '@/services/browserImageZip.ts'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {ProjectV2} from '@/types/project.ts'
import {showToast} from '@/utils/handleToast.ts'

type Props = {
  readonly project: ProjectV2
  readonly itemCount: number
}

type FormValues = {
  title: string
  isRemarkMode: boolean
}

export default function SaveImages({project, itemCount}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: {errors},
  } = useForm<FormValues>({defaultValues: {title: 'Photo', isRemarkMode: false}})

  const isRemarkMode = watch('isRemarkMode')
  useEffect(() => () => controllerRef.current?.abort(), [])

  const onSave: SubmitHandler<FormValues> = (formData) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setProgress(0)
    setIsLoading(true)
    showToast(
      async () => {
        const archive = await createImageExportZip(project, browserAssetStore, {
          title: formData.title,
          isRemarkMode: formData.isRemarkMode,
          signal: controller.signal,
          onProgress: completed => setProgress(completed),
        })
        const url = URL.createObjectURL(archive)
        try {
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `${normalizeImageExportFilename(formData.title) || 'Photo'}_圖片.zip`
          anchor.click()
        } finally {
          URL.revokeObjectURL(url)
        }
      },
      {success: '圖片 ZIP 下載成功', error: error => String(error)},
    ).finally(() => {
      if (controllerRef.current === controller) controllerRef.current = null
      setIsLoading(false)
    })
  }

  return (
    <Row>
      <Col xs={12}>
        <Alert color='info'>
          <IoMdAlert className='text-lg'/>
          將經壓縮、排序及旋轉後的圖片合併為單一 ZIP 下載；瀏覽器不會選擇或自動開啟資料夾。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='預設名稱' error={errors.title?.message}>
        <input
          type='text'
          className='input w-full'
          disabled={isLoading}
          {...register('title', {
            required: '請填寫預設名稱',
            validate: value => Boolean(value.trim()) || '請填寫預設名稱',
          })}
        />
        <label className='label mt-2 text-sm'>
          <input
            type='checkbox'
            className='checkbox'
            disabled={isLoading}
            {...register('isRemarkMode')}
          />
          將每張圖片的備註當作檔名儲存
        </label>
        {isRemarkMode &&
          <Alert color='warning'>
            <IoMdAlert className='text-lg'/>
            重複備註會自動加上穩定序號；空備註改用預設名稱，換行與檔名非法字元會以底線取代。
          </Alert>
        }
      </FormInputCol>
      <Col xs={12} className='mt-6'>
        {isLoading ?
          <div className='space-y-3'>
            <div className='text-center'>正在建立圖片 ZIP（{progress}/{itemCount}）</div>
            <progress className='progress progress-info w-full' value={progress} max={itemCount}/>
            <Button color='warning' shape='block' onClick={() => controllerRef.current?.abort()}>
              取消
            </Button>
          </div>
          :
          <Button color='success' shape='block' disabled={itemCount === 0} onClick={handleSubmit(onSave)}>
            <LuImageDown/>
            下載圖片 ZIP
          </Button>
        }
      </Col>
    </Row>
  )
}