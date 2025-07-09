import type {ButtonHTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";
import {IoMdArrowDropdown} from "react-icons/io";

type Props = {
  size?: "xl" | "lg" | "md" | "sm" | "xs",
  color?: "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error",
  style?: "outline" | "dash" | "soft" | "ghost" | "link",
  disabled?: boolean,
  shape?: 'block' | 'square' | 'circle', // 形狀
  dropdownIcon?: boolean, // 下拉選單的圖標
}

export default function DropdownToggle({
                                         size,
                                         color,
                                         style,
                                         disabled = false,
                                         shape,
                                         dropdownIcon = true,
                                         className,
                                         children
                                       }: Props & ButtonHTMLAttributes<HTMLButtonElement>) {

  const classes = twMerge(
    'btn',
    'flex',
    'items-center',
    className,
    clsx({
      'btn-xl': size === 'xl',
      'btn-lg': size === 'lg',
      'btn-md': size === 'md',
      'btn-sm': size === 'sm',
      'btn-xs': size === 'xs',
      'btn-block': shape === 'block',
      'btn-square': shape === 'square',
      'btn-circle': shape === 'circle',
      'btn-outline': style === 'outline',
      'btn-dash': style === 'dash',
      'btn-soft': style === 'soft',
      'btn-ghost': style === 'ghost',
      'btn-link': style === 'link',
      'btn-disabled': disabled,
      'btn-neutral': color === 'neutral',
      'btn-primary': color === 'primary',
      'btn-secondary': color === 'secondary',
      'btn-accent': color === 'accent',
      'btn-info': color === 'info',
      'btn-success': color === 'success',
      'btn-warning': color === 'warning',
      'btn-error': color === 'error',
    })
  );

  return (
    <div tabIndex={0} role="button" className={classes}>
      {children}
      {dropdownIcon && <IoMdArrowDropdown/>}
    </div>
  )
}