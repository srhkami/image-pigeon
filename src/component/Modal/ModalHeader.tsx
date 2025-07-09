import type {ReactNode} from "react";
import {twMerge} from "tailwind-merge";

type Props = {
  className?: string,
  divider?: boolean, // 分隔線（預設為否）
  children: ReactNode,
}

export default function ModalHeader({className, divider = false, children}: Props) {

  const classes = twMerge(
    'flex items-center',
    className,
  )

  return (
    <>
      <div className={classes}>
        {children}
      </div>
      {divider &&
        <div className='divider my-0'></div>
      }
    </>
  )
}