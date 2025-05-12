import Modal from "../Layout/Modal.tsx";
import {ReactNode, useState} from "react";
import {FaStarHalfAlt} from "react-icons/fa";

/* 各類功能提示的對話框 */
export default function ModalTip() {

  const [isShow, setIsShow] = useState<boolean>(false);

  return (
    <>
      <button className='btn  btn-secondary btn-soft' onClick={() => setIsShow(true)}>
        主要功能介紹
      </button>
      <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
        <div className='text-lg font-bold flex items-center justify-center'>
          <FaStarHalfAlt className='text-warning mr-2'/>
          主要功能介紹
        </div>
        <div className='divider mt-0'></div>
        <div className=''>
          <Collapse
            title='自動帶入預設說明'
            textList={[
              '同一個時、地、說明文字，不斷複製貼上很麻煩？',
              '點擊左下角「新增圖片」按鈕',
              '在上傳圖片前，先輸入「圖片預設說明」',
              '在新增圖片後，即可自動帶入每一個說明欄',
              '※請注意，如果您在預覽時編輯說明，請務必按下儲存修改',
            ]}
          />

          <Collapse
            title='自動分割長截圖'
            textList={[
              '民眾提供對話記錄長截圖，不知怎麼黏貼？',
              '點擊左下角「新增圖片」按鈕',
              '切換至「長截圖分割」，上傳長截圖',
              '現在長截圖已經自動以適當的高度分割成若干圖片了！',
            ]}
          />
          <Collapse
            title='自動壓縮圖片'
            textList={[
              '手機拍攝的圖片容量很大怎麼辦？',
              '點擊右下角「輸出檔案」按鈕',
              '設定「圖片壓縮最小尺寸」及「壓縮率」',
              '輸出後，即可得到一個小巧玲瓏的檔案！'
            ]}
          />
          <Collapse
            title='預覽編輯圖片'
            textList={[
              '拍照時圖片方向錯了？順序錯了？',
              '注意預覽中的圖片，右上角有幾顆按鈕',
              '「上下移動」：可重新排序圖片',
              '「左右旋轉」：可旋轉圖片角度',
              '「合併圖片」：可將兩個圖片結合，請注意此步驟無法復原',
            ]}
          />
          <Collapse
            title='輸出不同排版'
            textList={[
              '不同案件，所需要的照片黏貼方向不同怎麼辦？',
              '點擊右下角「輸出檔案」按鈕',
              '在「排版」選項選擇您所需要的排版',
              '目前支援3種不同樣式，若您有其他建議，歡迎聯繫作者新增！',
            ]}
          />
        </div>
      </Modal>
    </>
  )
}

type Props = {
  title: string,
  textList?: Array<string>,
  defaultChecked?: boolean,
  children?: ReactNode | null,
}

/* 手風琴組件
*  可傳入文字清單
*  或傳入一個子組件，則會優先顯示
*/
function Collapse({title, textList = [], defaultChecked = false, children = null}: Props) {

  const items = textList.map((text, index) => {
    if (index === 0) {
      return <li className="pb-2 text-xs opacity-60">{text}</li>
    }
    return (
      <li className="list-row" key='index'>
        <span className='mr-1'>{index}.</span>{text}
      </li>
    )
  })

  return (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
      <input type="radio" name="my-accordion-2" defaultChecked={defaultChecked}/>
      <div className="collapse-title font-semibold text-start">{title}</div>
      <div className="collapse-content text-sm text-start">
        {children ?
          children
          :
          <ul className="list">
            {items}
          </ul>
        }

      </div>
    </div>
  )
}