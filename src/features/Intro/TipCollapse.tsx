import {Collapse, CollapseContent, CollapseTitle} from "@/component";

type Props = {
  title: string,
  textList: Array<string>,
}

export default function TipCollapse({title, textList}:Props) {

  const items = textList.map((text, index) => {
    if (index === 0) {
      return <li className="pb-2 text-xs opacity-60">{text}</li>
    }
    return (
      <li className="list-row" key={index}>
        <span className='mr-1'>{index}.</span>{text}
      </li>
    )
  })

  return (
    <Collapse inputName='tip' className='my-2' icon='plus'>
      <CollapseTitle>
        {title}
      </CollapseTitle>
      <CollapseContent>
        <ul className="list">
          {items}
        </ul>
      </CollapseContent>
    </Collapse>
  )
}