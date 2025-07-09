import type {ReactNode} from "react";
import {twMerge} from "tailwind-merge";

type Props = {
  className?: string,
  children: ReactNode,
}

export default function ModalBody({className, children}: Props) {

  const classes = twMerge(
    'my-2 overflow-auto flex-1',
    className
  )

  return (
    <div className={classes}>
      {children}
    </div>
  )
}