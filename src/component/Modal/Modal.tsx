import {HTMLAttributes, type ReactNode} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";
import {Button} from "@/component";
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

type Props = {
  isShow: boolean, // 決定是否顯示
  onHide: () => void, // 關閉的函數
  closeButton?: boolean, // 關閉按鈕（預設否）
  backdrop?: boolean, // 可點擊背景關閉（預設是）
  size?: 'xs'| 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full',
  children: ReactNode,
}

export default function Modal({
                                isShow,
                                onHide,
                                closeButton = false,
                                backdrop = true,
                                size = 'md',
                                className,
                                children
                              }: Props & HTMLAttributes<HTMLDivElement>) {

  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setModalRoot(document.getElementById('modal-root'))
  }, [])

  if (!modalRoot || !isShow) return null

  const modalBoxClass = twMerge(
    'modal-box  max-h-[94vh] flex flex-col overflow-hidden',
    className,
    clsx({
      'max-w-[18rem]': size === 'xs',
      'max-w-[24rem]': size === 'sm',
      'max-w-[40rem]': size === 'lg',
      'max-w-[48rem]': size === 'xl',
      'max-w-[64rem]': size === '2xl',
      'max-w-full': size === 'full',
    })
  )

  return createPortal(
    <div role="dialog" className={clsx("modal", { "modal-open": isShow })}>
      <div className={modalBoxClass}>
        {closeButton &&
          <Button size='sm' shape='circle' style='ghost'
                  className="absolute right-2 top-2" onClick={onHide}>✕</Button>
        }
        {children}
      </div>
      {backdrop &&
        <label className="modal-backdrop" onClick={onHide}>Close</label>
      }
    </div>,
    modalRoot
  )
}
