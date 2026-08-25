import {useEffect, useRef, useState} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {HiSaveAs} from 'react-icons/hi'
import {Alert, Button, Col, FormInputCol, Row} from '@/component'
import {AlertLoading} from '@/layout'
import {ProjectV2} from '@/types/project.ts'
import {showToast} from '@/utils/handleToast.ts'
import {IoMdAlert} from 'react-icons/io'
import {createProjectArchive} from '@/services/browserProjectArchive.ts'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {throwIfAborted} from '@/services/browserRuntimeContract.ts'

type Props = {
  readonly project: ProjectV2
  readonly itemCount: number
  readonly setProject: (project: ProjectV2) => void
}

type FormValues = {
  projectName: string
}

export default function SaveProject({project, itemCount, setProject}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const {register, handleSubmit, reset, formState: {errors}} = useForm<FormValues>({
    defaultValues: {projectName: project.document.title || '照片黏貼表'},
  })

  useEffect(() => {
    reset({projectName: project.document.title || '照片黏貼表'})
  }, [project.document.title, reset])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const onSave: SubmitHandler<FormValues> = (formData) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    showToast(
      async () => {
        const projectName = formData.projectName.trim()
        const nextProject: ProjectV2 = {
          ...project,
          document: {
            ...project.document,
            title: projectName,
          },
        }

        const archive = await createProjectArchive(nextProject, browserAssetStore, controller.signal)
        throwIfAborted(controller.signal)
        const url = URL.createObjectURL(archive)
        try {
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = `${projectName.replace(/[\\/:*?"<>|]+/g, '_')}.ipigeon`
          anchor.click()
        } finally {
          URL.revokeObjectURL(url)
        }
        setProject(nextProject)
      },
      {success: '專案儲存成功', error: (err) => String(err)},
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
          儲存單一貼圖小鴿手專案檔（.ipigeon），包含壓縮後圖片與設定，可於之後使用「開啟專案」繼續編輯。
        </Alert>
      </Col>
      <FormInputCol xs={12} label='專案名稱' error={errors.projectName?.message}>
        <input
          type='text'
          className='input w-full'
          {...register('projectName', {
            required: '請填寫專案名稱',
            validate: (value) => Boolean(value.trim()) || '請填寫專案名稱',
          })}
        />
      </FormInputCol>
      <Col xs={12} className='mt-6'>
        {isLoading ?
          <AlertLoading/>
          :
          <Button
            color='success'
            shape='block'
            disabled={itemCount === 0}
            onClick={handleSubmit(onSave)}
          >
            <HiSaveAs/>
            儲存專案
          </Button>
        }
      </Col>
    </Row>
  )
}
