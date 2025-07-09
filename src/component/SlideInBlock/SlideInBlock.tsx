import {HTMLAttributes, ReactNode} from "react";

type Props = {
  children: ReactNode,
  direction?: 'left' | 'right' | 'up' | 'down', // 動畫方向
  delay?: number, // 每張圖片進場延遲，單位毫秒（例如 100、200）
  duration?: number, //動畫長度（例如 500ms、700ms）
}

export default function SlideInBlock({
                                       children,
                                       direction = 'left',
                                       delay = 0,
                                       duration = 700,
                                       className = '',
                                     }: Props & HTMLAttributes<HTMLDivElement>) {

  // 對應 AOS 動畫方向
  const animationMap: Record<string, string> = {
    left: 'fade-right',
    right: 'fade-left',
    up: 'fade-down',
    down: 'fade-up',
  }

  return (
    <div
      data-aos={animationMap[direction]}
      data-aos-delay={delay}
      data-aos-duration={duration}
      className={className}
    >
      {children}
    </div>
  )
}
