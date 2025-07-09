import type { DetailedHTMLProps, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

type Props = {
  color?: null | 'info' | 'success' | 'warning' | 'error',
  style?: null | 'outline' | 'dash' | 'soft',
}

export default function Alert({
  color,
  style,
  className,
  children
}: Props & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {

  const classes = twMerge(
    'alert alert-vertical sm:alert-horizontal',
    className,
    clsx({
      'alert-info': color === 'info',
      'alert-success': color === 'success',
      'alert-warning': color === 'warning',
      'alert-error': color === 'error',
      'alert-outline': style === 'outline',
      'alert-dash': style === 'dash',
      'alert-soft': style === 'soft',
    })
  );

  return (
    <div role="alert" className={classes}>
      {children}
    </div>
  )
}