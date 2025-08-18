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
            title='自動帶入預設備註'
            textList={[
              '同樣的時、地、說明文字，不斷複製貼上很麻煩？',
              '使用「新增圖片」功能',
              '在上傳圖片前，先輸入「圖片預設備註」',
              '在新增圖片後，即可自動帶入每一個備註欄位',
            ]}
          />
          <TipCollapse
            title='圖片自動壓縮'
            textList={[
              '手機拍攝的圖片佔用空間很大？',
              '使用「新增圖片」中「多檔上傳」功能',
              '設定「圖片壓縮品質」及「壓縮最小尺寸」',
              '按下「新增」，所有圖片便會自動壓縮!',
            ]}
          />
          <TipCollapse
            title='自動分割長截圖'
            textList={[
              '民眾提供對話記錄長截圖，不知怎麼黏貼？',
              '使用「新增圖片」中「長截圖分割」功能',
              '上傳一張手機長截圖圖片',
              '現在長截圖已經自動以適當的高度分割成若干圖片了！',
            ]}
          />
          <TipCollapse
            title='編輯排序圖片'
            textList={[
              '照片方向錯了？順序錯了？',
              '長按圖片左上角按鈕，可拖拽圖片重新排序',
              '「左右旋轉」：可旋轉圖片角度',
              '「合併圖片」：可將兩個圖片結合，請注意此步驟無法復原',
              '可分別編輯每張圖片的備註，編輯完畢會自動儲存'
            ]}
          />
          <TipCollapse
            title='圖片編號/命名'
            textList={[
              '同一案件的圖片數量很多，難以整理？',
              '使用「輸出檔案」中「另存圖片」功能',
              '輸入「預設標題」，作為圖片預設檔名；或將每張圖片的備註當作檔名',
              '按下「另存圖片」按鈕，將排序或命名好的圖片匯出',
            ]}
          />
          <TipCollapse
            title='輸出不同Word排版'
            textList={[
              '不同案件，所需要的照片黏貼方向不同怎麼辦？',
              '使用「輸出檔案」中「儲存WORD」功能',
              '在「排版」選項選擇您所需要的排版，並可設定文字對齊方式及字體大小',
              '目前支援3種不同樣式，若您有其他建議，歡迎聯繫作者新增！',
            ]}
          />
          <TipCollapse
            title='輸出/讀取專用檔案'
            textList={[
              '圖片編輯到一半，想稍後再次編輯？',
              '使用「輸出檔案」中「儲存專用檔案」功能',
              '可將目前壓縮、排序、編輯過的圖片暫存成一個專用檔案',
              '使用「新增圖片」中「讀取舊檔」功能',
              '即可復原之前編輯過的所有圖片！'
            ]}
          />
        </ModalBody>
      </Modal>
    </>
  )
}
