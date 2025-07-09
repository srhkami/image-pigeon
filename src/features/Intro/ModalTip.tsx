import {useState} from "react";
import {FaStarHalfAlt} from "react-icons/fa";
import {Button, Modal, ModalBody, ModalHeader} from "@/component";
import TipCollapse from "@/features/Intro/TipCollapse.tsx";

/* 各類功能提示的對話框 */
export default function ModalTip() {

  const [isShow, setIsShow] = useState<boolean>(false);

  return (
    <>
      <Button color='accent' style='outline' onClick={() => setIsShow(true)}>
        主要功能介紹
      </Button>
      <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
        <ModalHeader className='justify-center text-lg font-bold' divider>
          <FaStarHalfAlt className='text-warning mr-2'/>
          主要功能介紹
        </ModalHeader>
        <ModalBody>
          <TipCollapse
            title='自動帶入預設說明'
            textList={[
              '同一個時、地、說明文字，不斷複製貼上很麻煩？',
              '點擊左下角「新增圖片」按鈕',
              '在上傳圖片前，先輸入「圖片預設說明」',
              '在新增圖片後，即可自動帶入每一個說明欄',
              '※請注意，如果您在預覽時編輯說明，請務必按下儲存修改',
            ]}
          />

          <TipCollapse
            title='自動分割長截圖'
            textList={[
              '民眾提供對話記錄長截圖，不知怎麼黏貼？',
              '點擊左下角「新增圖片」按鈕',
              '切換至「長截圖分割」，上傳長截圖',
              '現在長截圖已經自動以適當的高度分割成若干圖片了！',
            ]}
          />
          <TipCollapse
            title='圖片自動壓縮及編號'
            textList={[
              '手機拍攝的圖片容量很大？數量多難以編號？',
              '點擊右下角「輸出檔案」按鈕',
              '輸入「預設標題」，作為圖片預設檔名',
              '設定「圖片壓縮最小尺寸」及「壓縮率」',
              '按下「另存圖片」按鈕，將整理、壓縮好的圖片匯出，就能得到有序又小巧的檔案！',
            ]}
          />
          <TipCollapse
            title='預覽編輯圖片'
            textList={[
              '照片方向錯了？順序錯了？',
              '在預覽中的圖片中，試著點擊右上角的按鈕',
              '「上下移動」：可重新排序圖片',
              '「左右旋轉」：可旋轉圖片角度',
              '「合併圖片」：可將兩個圖片結合，請注意此步驟無法復原',
            ]}
          />
          <TipCollapse
            title='輸出不同排版'
            textList={[
              '不同案件，所需要的照片黏貼方向不同怎麼辦？',
              '點擊右下角「輸出檔案」按鈕',
              '在「排版」選項選擇您所需要的排版，並可設定文字對齊方式及字體大小',
              '目前支援3種不同樣式，若您有其他建議，歡迎聯繫作者新增！',
            ]}
          />
        </ModalBody>
      </Modal>
    </>
  )
}
