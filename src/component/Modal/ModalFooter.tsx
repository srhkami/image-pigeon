import type {ReactNode} from "react";
import {twMerge} from "tailwind-merge";

type Props = {
  className?: string,
  divider?: boolean, // 分隔線（預設為否）
  children: ReactNode,
}

export default function ModalFooter({className, divider = false, children}: Props) {

  const classes = twMerge(
    'flex items-center justify-end',
    className,
  )

  return (
    <>
      {divider &&
        <div className='divider my-0'></div>
      }
      <div className={classes}>
        {children}
      </div>
    </>
  )
}