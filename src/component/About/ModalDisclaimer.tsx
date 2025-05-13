import Modal from "../Layout/Modal.tsx";

type Props = {
  readonly isShow: boolean,
  readonly setIsShow: (value: boolean) => void,
}

export default function ModalDisclaimer({isShow, setIsShow}: Props) {
  return (
    <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
      <div className="card-body">
        <h2 className="card-title">免責聲明</h2>
        <p className='text-start indent-7'>
          本程式使用 Python + React 編寫而成，除自動檢測更新功能外，其餘功能均不連網，不涉及任何上傳資訊至網際網路的功能。
        </p>
        <p className='text-start indent-7'>
          本程式操作資料的功能，只限於將使用者自行選擇的檔案，進行讀取、複製、壓縮、另存新檔等操作，不涉及任何刪除、修改原檔案的功能。
        </p>
        <p className='text-start indent-7 underline'>
          如您對上列事項有任何顧慮，請立即關閉並刪除此軟體，否則均視為您已同意本聲明。
        </p>
      </div>
    </Modal>
  )
}