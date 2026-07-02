import {Dispatch, SetStateAction} from 'react'
import {Button} from '@/component'
import {CustomImage} from '@/utils/type.ts'
import {ProjectV2} from '@/types/project.ts'
import {checkStatus} from '@/utils/handleError.ts'
import {showToast} from '@/utils/handleToast.ts'
import {openProject} from '@/services/projectApi.ts'
import {toCustomImagesFromProject} from '@/state/projectImageAdapter.ts'
import {HiFolderOpen,} from 'react-icons/hi'
import toast from 'react-hot-toast'

type Props = {
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setSessionId: Dispatch<SetStateAction<string | null>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
  readonly itemCount: number
}

function getPywebviewApi() {
  const api = window.pywebview?.api
  if (!api) {
    throw new Error('請在桌面程式中使用專案儲存/開啟功能')
  }
  return api
}

export default function OpenProject({setProject, setSessionId, setImages, itemCount}: Props) {

  const openSelectedProject = () => {
    showToast(
      async () => {
        const res = await getPywebviewApi().select_path({mode: 'project-open'})
        checkStatus(res)

        const opened = await openProject({projectPath: res.message})
        setProject(opened.data.project)
        setSessionId(opened.data.sessionId)
        setImages(() => toCustomImagesFromProject(opened.data.project, opened.data.sessionId))

      },
      {success: '專案開啟成功', error: (err) => String(err)},
    )
  }

  const handleOpen = () => {
    if (itemCount === 0) {
      openSelectedProject()
      return
    }

    toast(t => (
      <div className='w-56'>
        <div className='font-bold'>是否開啟其他專案？</div>
        <div className='text-sm text-error text-start'>會清除目前預覽的所有圖片，此操作無法復原。如需再次編輯，請先儲存當前專案。</div>
        <div className='flex justify-end mt-2'>
          <Button size='sm' color='error' onClick={() => {
            toast.dismiss(t.id)
            openSelectedProject()
          }}>
            確定
          </Button>
          <Button size='sm' className='ml-2' onClick={() => toast.dismiss(t.id)}>
            取消
          </Button>
        </div>
      </div>
    ))
  }

  return (
      <Button color='primary' onClick={handleOpen}>
        <HiFolderOpen/> 開啟專案
      </Button>
  )
}
