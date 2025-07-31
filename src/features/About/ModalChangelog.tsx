import {LuNotebookTabs} from "react-icons/lu";
import {Modal, ModalBody, ModalHeader} from "@/component";
import {CHANGELOG_LIST} from "@/utils/log.ts";
import ChangelogCollapse from "@/features/About/ChangelogCollapse.tsx";

type Props = {
  readonly isShow: boolean,
  readonly setIsShow: (value: boolean) => void,
}

/* 顯示更新日誌的對話框 */
export default function ModalChangelog({isShow, setIsShow}: Props) {

  const Collapses = CHANGELOG_LIST.map(obj => {
    return (
      <ChangelogCollapse key={obj.version} obj={obj}/>
    )
  })

  return (
    <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
      <ModalBody>
        <ModalHeader className='justify-center' divider>
          <LuNotebookTabs className='text-info mr-2'/>
          更新日誌
        </ModalHeader>
        <div>
          {Collapses}
        </div>
      </ModalBody>
    </Modal>
  )
}