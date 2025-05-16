import Modal from "../Layout/Modal.tsx";
import {ReactNode} from "react";
import {LuNotebookTabs} from "react-icons/lu";
import {CHANGELOG_LIST} from "../../utils/info.ts";

type Props = {
  readonly isShow: boolean,
  readonly setIsShow: (value: boolean) => void,
}

/* 各類功能提示的對話框 */
export default function ModalChangelog({isShow, setIsShow}: Props) {

  const Collapses = CHANGELOG_LIST.map(item=>{
    return(
      <Collapse
        title={item.version+'（'+item.date+'）'}
        itemList={item.logs}
      />
    )
  })

  return (
    <Modal isShow={isShow} onHide={() => setIsShow(false)} closeButton>
      <div className='text-lg font-bold flex items-center justify-center'>
        <LuNotebookTabs className='text-info mr-2'/>
        更新日誌
      </div>
      <div className='divider mt-0'></div>
      <div>
        {Collapses}
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