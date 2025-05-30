import {HTMLAttributes, type ReactNode} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";
import {Button} from "./Button.tsx";

type Props = {
  isShow: boolean, // 決定是否顯示
  onHide: () => void, // 關閉的函數
  closeButton?: boolean, // 關閉按鈕（預設否）
  backdrop?: boolean, // 可點擊背景關閉（預設是）
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full',
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

  const classes = twMerge(
    'modal-box',
    className,
    clsx({
      'max-w-[24rem]': size === 'sm',
      'max-w-[40rem]': size === 'lg',
      'max-w-[48rem]': size === 'xl',
      'max-w-[64rem]': size === '2xl',
      'max-w-full': size === 'full',
    })
  )

  return (
    <>
      <input type="checkbox" className="modal-toggle" checked={isShow} readOnly/>
      <div role="dialog" className="modal">
        <div className={classes}>
          {closeButton &&
            <Button size='sm' shape='circle' style='ghost'
                    className="absolute right-2 top-2" onClick={onHide}>✕</Button>
          }
          {children}
        </div>
        {backdrop &&
          <label className="modal-backdrop" onClick={onHide}>Close</label>
        }
      </div>
    </>
  );
}