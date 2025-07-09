import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";

type Props = {
  aligns?: 'start' | 'center' | 'end',
  position?: 'top' | 'bottom' | 'left' | 'right',
}

export default function Dropdown({aligns, position, className, children}: Props & HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'dropdown',
    className,
    clsx({
      'dropdown-start': aligns === 'start',
      'dropdown-center': aligns === 'center',
      'dropdown-end': aligns === 'end',
      'dropdown-top': position === 'top',
      'dropdown-bottom': position === 'bottom',
      'dropdown-left': position === 'left',
      'dropdown-right': position === 'right',
    })
  )

  return (
    <div className={classes}>
      {children}
    </div>
  )
}