import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";

type Props = {
  icon?: null | 'arrow' | 'plus'
  defaultChecked?: boolean
  inputName?: string, // 如果傳入了Name，則使用單選模式(radio)，以轉化為手風琴組件
}

export default function Collapse({
                                   icon = null,
                                   defaultChecked = false,
                                   inputName,
                                   className,
                                   children
                                 }: Props & HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'collapse bg-base-100 border-base-300 border',
    className,
    clsx({
      'collapse-arrow': icon === 'arrow',
      'collapse-plus': icon === 'plus',
    })
  )

  return (
    <div className={classes}>
      {inputName ?
        <input type="radio" name={inputName} defaultChecked={defaultChecked}/>
        :
        <input type="checkbox" defaultChecked={defaultChecked}/>}
      {children}
    </div>
  )
}