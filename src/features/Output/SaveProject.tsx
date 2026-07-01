import {useEffect, useState} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {HiSaveAs} from 'react-icons/hi'
import {Alert, Button, Col, FormInputCol, Row} from '@/component'
import {AlertLoading} from '@/layout'
import {ProjectV2} from '@/types/project.ts'
import {checkStatus} from '@/utils/handleError.ts'
import {showToast} from '@/utils/handleToast.ts'
import {saveProject} from '@/services/projectApi.ts'
import {IoMdAlert} from 'react-icons/io'

type Props = {
  readonly project: ProjectV2
  readonly sessionId: string | null
  readonly itemCount: number
  readonly setProject: (project: ProjectV2) => void
}

type FormValues = {
  projectName: string
}

function getPywebviewApi() {
  const api = window.pywebview?.api
  if (!api) {
    throw new Error('請在桌面程式中使用專案儲存功能')
  }
  return api
}

export default function SaveProject({project, sessionId, itemCount, setProject}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const {register, handleSubmit, reset, formState: {errors}} = useForm<FormValues>({
    defaultValues: {projectName: project.document.title || '照片黏貼表'},
  })

  useEffect(() => {
    reset({projectName: project.document.title || '照片黏貼表'})
  }, [project.document.title, reset])

  const onSave: SubmitHandler<FormValues> = (formData) => {
    setIsLoading(true)
    showToast(
      async () => {
        if (!sessionId) {
          throw new Error('尚未建立圖片 session，請先新增圖片')
        }

        const projectName = formData.projectName.trim()
        const nextProject: ProjectV2 = {
          ...project,
          document: {
            ...project.document,
            title: projectName,
          },
        }

        const res = await getPywebviewApi().select_path({
          mode: 'project-save',
          title: projectName,
        })
        checkStatus(res)

        const saved = await saveProject({
          sessionId,
          project: nextProject,
          targetPath: res.message,
        })
        setProject(saved.data.project)
      },
      {success: '專案儲存成功', error: (err) => String(err)},
    ).finally(() => setIsLoading(false))
  }

  return (
    <Row>
      <Col xs={12}>
        <Alert color='info'>
          <IoMdAlert className='text-lg'/>
          儲存貼圖小鴿手專案資料夾（.ipigeon），包含壓縮後之圖片檔案及設定檔，可於之後使用「開啟專案」繼續編輯。
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
            disabled={!sessionId || itemCount === 0}
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
