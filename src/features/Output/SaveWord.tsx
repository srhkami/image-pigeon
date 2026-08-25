import {useEffect, useRef, useState} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {FaRegFileWord} from 'react-icons/fa6'
import {IoMdAlert} from 'react-icons/io'

import {Alert, Button, Col, FormInputCol, Row} from '@/component'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {normalizeImageExportFilename} from '@/services/browserImageZip.ts'
import {createBrowserWordBlob} from '@/services/browserWordExporter.ts'
import {createBrowserWordItems} from '@/services/browserWordProjectAdapter.ts'
import {throwIfAborted} from '@/services/browserRuntimeContract.ts'
import {ProjectV2} from '@/types/project.ts'
import {showToast} from '@/utils/handleToast.ts'

type Props = {
  readonly project: ProjectV2
  readonly itemCount: number
}

type FormValues = {
  title: string
  alignVertical: 'top' | 'center'
  fontSize: '10' | '11' | '12' | '13' | '14'
}

export default function SaveWord({project, itemCount}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const controllerRef = useRef<AbortController | null>(null)
  const {register, handleSubmit, formState: {errors}} = useForm<FormValues>({
    defaultValues: {title: '照片黏貼表', alignVertical: 'center', fontSize: '12'},
  })
  useEffect(() => () => controllerRef.current?.abort(), [])

  const onSave: SubmitHandler<FormValues> = formData => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setProgress(0)
    setIsLoading(true)
    showToast(async () => {
      const items = await createBrowserWordItems(project, browserAssetStore, {
        signal: controller.signal,
        onProgress: completed => setProgress(completed),
      })
      throwIfAborted(controller.signal)
      const {blob} = await createBrowserWordBlob({
        title: formData.title.trim() || '照片黏貼表',
        alignVertical: formData.alignVertical,
        fontSize: Number(formData.fontSize),
        items,
      })
      throwIfAborted(controller.signal)
      const url = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${normalizeImageExportFilename(formData.title) || '照片黏貼表'}.docx`
        anchor.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    }, {success: 'Word 文件下載成功', error: error => String(error)}).finally(() => {
      if (controllerRef.current === controller) controllerRef.current = null
      setIsLoading(false)
    })
  }

  return <Row>
    <Col xs={12}><Alert color='info'><IoMdAlert className='text-lg'/>會生成一個 WORD 檔提供下載</Alert></Col>
    <FormInputCol xs={12} label='文件標題 / 檔案名稱' error={errors.title?.message}>
      <input type='text' className='input w-full' disabled={isLoading} {...register('title')}/>
    </FormInputCol>
    <FormInputCol xs={6} label='說明文字對齊' error={errors.alignVertical?.message}>
      <select className='select w-full' disabled={isLoading} {...register('alignVertical')}>
        <option value='top'>垂直置頂</option>
        <option value='center'>垂直置中</option>
      </select>
    </FormInputCol>
    <FormInputCol xs={6} label='字體大小' error={errors.fontSize?.message}>
      <select className='select w-full'
              disabled={isLoading} {...register('fontSize')}>{['10', '11', '12', '13', '14'].map(size => <option
        key={size} value={size}>{size}</option>)}</select>
    </FormInputCol>
    <Col xs={12} className='mt-6'>
      {isLoading ? <div className='space-y-3'>
          <div className='text-center'>正在建立 Word 文件（{progress}/{itemCount}）</div>
          <progress className='progress progress-info w-full' value={progress} max={itemCount}/>
          <Button color='warning' shape='block' onClick={() => controllerRef.current?.abort()}>取消</Button></div>
        :
        <Button color='success' shape='block' disabled={itemCount === 0} onClick={handleSubmit(onSave)}><FaRegFileWord/>下載
          Word</Button>}
    </Col>
  </Row>
}
