import {Badge, Collapse, CollapseContent, CollapseTitle} from "@/component";
import {TVersionObject} from "@/utils/type.ts";

type Props = {
  obj: TVersionObject,
}

/* 顯示更新日誌的手風琴組件*/
export default function ChangelogCollapse({obj}: Props) {

  const items = obj.logs.map((item, index) => {
    const color = item.color;
    const LogBadge = () => {
      if (color === 'new') {
        return <Badge size='sm' color='success' className='w-full'>new</Badge>
        // <div className="badge badge-sm badge-success w-full">new</div>
      } else if (color === 'info') {
        return <Badge size='sm' color='info' className='w-full'>info</Badge>
      } else if (color === 'fix') {
        return <Badge size='sm' color='error' className='w-full'>fix</Badge>
      }
    }
    return (
      <li className="list-row grid grid-cols-6" key={index}>
        <div className='px-1'><LogBadge/></div>
        <span className='mr-1 col-span-5'>{item.text}</span>
      </li>
    )
  })

  return (
    <Collapse inputName='change_log' className='my-2' icon='plus'>
      <CollapseTitle>
        {obj.version + '（' + obj.date + '）'}
      </CollapseTitle>
      <CollapseContent>
        {items}
      </CollapseContent>
    </Collapse>

  )
}