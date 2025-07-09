import type {HTMLAttributes} from "react";
import clsx from 'clsx'
import {twMerge} from 'tailwind-merge'

type Props = {
  size?: "xl" | "lg" | "md" | "sm" | "xs",
  color?: "neutral" | "primary" | "secondary" | "accent" | "info" | "success" | "warning" | "error",
  style?: "outline" | "dash" | "soft",
}

export default function Badge({size, color, style, className, children}: Props & HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'badge',
    className,
    clsx({
      'badge-xl': size === 'xl',
      'badge-lg': size === 'lg',
      'badge-md': size === 'md',
      'badge-sm': size === 'sm',
      'badge-xs': size === 'xs',
      'badge-outline': style === 'outline',
      'badge-dash': style === 'dash',
      'badge-soft': style === 'soft',
      'badge-neutral': color === 'neutral',
      'badge-primary': color === 'primary',
      'badge-secondary': color === 'secondary',
      'badge-accent': color === 'accent',
      'badge-info': color === 'info',
      'badge-success': color === 'success',
      'badge-warning': color === 'warning',
      'badge-error': color === 'error',
    })
  );

  return (
    <div className={classes}>
      {children}
    </div>
  );
}