import {Badge, Collapse, CollapseContent, CollapseTitle} from "@/component";
import {TVersionObject} from "@/utils/type.ts";
import clsx from "clsx";

type Props = {
  readonly obj: TVersionObject,
}

/* 顯示更新日誌的手風琴組件*/
export default function ChangelogCollapse({obj}: Props) {

  const items = obj.logs.map(item => {
    const color = clsx({
      'success': item.color === 'new',
      'info': item.color === 'info',
      'error': item.color === 'fix',
    }) as 'success' | 'info' | 'error';

    return (
      <li className="flex items-center my-1" key={item.text}>
        <Badge size='sm' color={color} className='w-10 mr-2'>{item.color}</Badge>
        <span>{item.text}</span>
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