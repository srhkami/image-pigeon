import type {ReactNode} from "react";

type Props = {
  className?: string,
  children: ReactNode,
}

export default function ModalTitle({className, children}: Props) {
  return (
    <p className={'text-xl font-bold ' + className}>{children}</p>
  )
}