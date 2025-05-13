import Modal from "../Layout/Modal.tsx";
import {ReactNode} from "react";
import {LuNotebookTabs} from "react-icons/lu";

type Props = {
  readonly isShow: boolean,
  readonly setIsShow: (value: boolean) => void,
}

/* 各類功能提示的對話框 */
export default function ModalChangelog({isShow, setIsShow}: Props) {

  return (
    <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
      <div className='text-lg font-bold flex items-center justify-center'>
        <LuNotebookTabs className='text-info mr-2'/>
        更新日誌
      </div>
      <div className='divider mt-0'></div>
      <div className=''>
        <Collapse
          title='1.1（1140513）'
          itemList={[
            {color: "new", text: '加入「另存圖片」功能'},
            {color: "new", text: '加入「免責聲明」'},
            {color: "new", text: '加入「更新日誌」'},
            {color: "new", text: '現在處理過程中會顯示新的提示'},
          ]}
        />
        <Collapse
          title='1.0（1140512）'
          itemList={[
            {color: "new", text: '加入「一頁兩張左右排版」'},
            {color: "new", text: '加入「主要功能介紹」'},
            {color: "fix", text: '修復圖片長寬可能超出表格的問題'},
          ]}
        />
        <Collapse
          title='0.9（1140511）'
          itemList={[
            {color: "new", text: '加入「檢查更新」功能'},
            {color: "new", text: '加入「合併圖片」功能'},
            {color: "new", text: '發佈公開測試版'},
          ]}
        />
        <Collapse
          title='0.8（1140510）'
          itemList={[
            {color: "new", text: '完成基礎功能，發佈內部測試版'},
          ]}
        />
      </div>
    </Modal>
  )
}

type CollapseProps = {
  title: string,
  itemList?: Array<{ color: 'new' | 'info' | 'fix', text: string }>,
  children?: ReactNode | null,
}

/* 手風琴組件
*  可傳入項目清單
*  或傳入一個子組件，則會優先顯示
*/
function Collapse({title, itemList = [], children = null}: CollapseProps) {

  const items = itemList.map((item, index) => {
    const color = item.color;
    const Badge = () => {
      if (color === 'new') {
        return <div className="badge badge-sm badge-success w-full">new</div>
      } else if (color === 'info') {
        return <div className="badge badge-sm badge-accent w-full">info</div>
      } else if (color === 'fix') {
        return <div className="badge badge-sm badge-error w-full">fix</div>
      }
    }
    return (
      <li className="list-row grid grid-cols-6" key={index}>
        <div className='px-1'><Badge/></div>
        <span className='mr-1 col-span-5'>{item.text}</span>
      </li>
    )
  })

  return (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
      <input type="radio" name="my-accordion-2"/>
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