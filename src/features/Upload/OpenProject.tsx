import {ChangeEvent, Dispatch, SetStateAction, useEffect, useRef} from 'react'
import {Button} from '@/component'
import {CustomImage} from '@/utils/type.ts'
import {ProjectV2} from '@/types/project.ts'
import {showToast} from '@/utils/handleToast.ts'
import {openProjectArchive, type OpenedBrowserProject} from '@/services/browserProjectArchive.ts'
import {browserAssetStore} from '@/services/browserAssetStore.ts'
import {toCustomImagesFromProject} from '@/state/projectImageAdapter.ts'
import {
  browserProjectOperationCoordinator,
  type BrowserProjectOperationLease,
} from '@/services/browserProjectOperation.ts'
import {HiFolderOpen,} from 'react-icons/hi'
import toast from 'react-hot-toast'

type Props = {
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setSessionId: Dispatch<SetStateAction<string | null>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
  readonly itemCount: number
}

export default function OpenProject({setProject, setSessionId, setImages, itemCount}: Props) {
  const archiveInputRef = useRef<HTMLInputElement | null>(null)
  const operationRef = useRef<BrowserProjectOperationLease | null>(null)

  useEffect(() => () => operationRef.current?.cancel(), [])

  const applyOpenedProject = (opened: OpenedBrowserProject) => {
    browserAssetStore.replaceAll(opened.assets)
    setProject(opened.project)
    setSessionId(null)
    setImages(() => toCustomImagesFromProject(opened.project, ''))
  }

  const runOpen = (operation: (signal: AbortSignal) => Promise<OpenedBrowserProject>) => {
    operationRef.current?.cancel()
    const lease = browserProjectOperationCoordinator.begin()
    operationRef.current = lease
    showToast(async () => {
      const opened = await operation(lease.signal)
      lease.assertCurrent()
      applyOpenedProject(opened)
    }, {
      success: '專案開啟成功',
      error: (error) => String(error),
    }).finally(() => {
      lease.finish()
      if (operationRef.current === lease) operationRef.current = null
    })
  }

  const confirmThenSelect = (input: HTMLInputElement | null) => {
    if (itemCount === 0) {
      input?.click()
      return
    }

    toast(t => (
      <div className='w-56'>
        <div className='font-bold'>是否開啟其他專案？</div>
        <div className='text-sm text-error text-start'>會清除目前預覽的所有圖片，此操作無法復原。如需再次編輯，請先儲存當前專案。</div>
        <div className='flex justify-end mt-2'>
          <Button size='sm' color='error' onClick={() => {
            toast.dismiss(t.id)
            input?.click()
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

  const onArchiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) runOpen(signal => openProjectArchive(file, signal))
  }

  return (
    <div className='flex flex-col gap-2'>
      <input ref={archiveInputRef} type='file' accept='.ipigeon' className='hidden' onChange={onArchiveChange}/>
      <Button color='primary' onClick={() => confirmThenSelect(archiveInputRef.current)}>
        <HiFolderOpen/> 開啟專案檔
      </Button>
    </div>
  )
}
