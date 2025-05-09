import Modal from "../Layout/Modal.tsx";

type Props = {
  readonly isShow: boolean,
  readonly setIsShow: (value: boolean) => void,
}

export default function ModalAbout({isShow, setIsShow}: Props) {


  return (
    <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
      <div>關於此程式</div>

    </Modal>
  )
}