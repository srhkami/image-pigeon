import {useModal} from "@/hooks";
import {Button, Modal, ModalHeader} from "@/component";
import {LuImageUp} from "react-icons/lu";

export default function ModalReadJson() {

  const {isShow, onShow, onHide} = useModal();

  return (
    <>
      <Button color='primary' onClick={onShow}>
        讀取存檔
      </Button>
      <Modal isShow={isShow} onHide={onHide} closeButton>
        <ModalHeader className='justify-center text-lg font-bold'>
          <LuImageUp className='mr-2'/>
          <span>讀取專用存檔</span>
        </ModalHeader>

      </Modal>
    </>
  )
}