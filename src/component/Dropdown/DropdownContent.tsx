import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";

type Props = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl',
}

export default function DropdownContent({size = 'md', className, children}: Props & HTMLAttributes<HTMLUListElement>) {

  const classes = twMerge(
    'dropdown-content',
    'bg-base-100',
    'rounded-box',
    'z-1',
    'p-2',
    'shadow-sm',
    className,
    clsx({
      'w-16': size === 'xs',
      'w-24': size === 'sm',
      'w-36': size === 'md',
      'w-48': size === 'lg',
      'w-60': size === 'xl',
      'w-80': size === '2xl',
    })
  )

  return (
    <div className={classes}>
      {children}
    </div>
  )
}