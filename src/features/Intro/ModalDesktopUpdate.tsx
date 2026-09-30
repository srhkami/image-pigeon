import {useEffect, useState} from 'react'
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from '@/component'
import {EXTERNAL_NAVIGATION_URLS} from '@/services/browserExternalNavigation.ts'
import {desktopUpdate, type DesktopUpdateAvailableResult} from '@/services/desktopUpdate.ts'

export default function ModalDesktopUpdate() {
  const [update, setUpdate] = useState<DesktopUpdateAvailableResult | null>(null)

  useEffect(() => {
    let active = true
    void desktopUpdate.checkForUpdates().then((result) => {
      if (active && desktopUpdate.shouldPrompt(result)) setUpdate(result)
    })
    return () => {
      active = false
    }
  }, [])

  const onHide = () => {
    desktopUpdate.dismiss()
    setUpdate(null)
  }

  const onIgnore = () => {
    if (update) desktopUpdate.ignore(update)
    setUpdate(null)
  }

  return (
    <Modal isShow={update !== null} onHide={onHide} closeButton>
      <ModalHeader className='justify-center text-lg font-bold'>有新版本可供下載！</ModalHeader>
      <ModalBody>
        <p>最新版本：{update?.app_version}</p>
        <p className='whitespace-pre-wrap'>{update?.whats_new}</p>
      </ModalBody>
      <ModalFooter divider>
        <Button style='ghost' onClick={onIgnore}>忽略此版本</Button>
        <a className='btn btn-primary ml-2' href={EXTERNAL_NAVIGATION_URLS.updateFolder} target='_blank' rel='noopener noreferrer'>
          立即更新
        </a>
      </ModalFooter>
    </Modal>
  )
}
