import {twMerge} from "tailwind-merge";
import clsx from "clsx";

type Props = {
  style?:'spinner'|'dots'|'ring'|'ball'|'bars'|'infinity',
  size?:'xs'|'sm'|'md'|'lg'|'xl',
  className?:string,
}

export default function Loading({style='spinner',size='md', className}: Props) {

  const classes = twMerge(
    'loading',
    className,
    clsx({
      'loading-spinner': style === 'spinner',
      'loading-dots': style === 'dots',
      'loading-ring': style === 'ring',
      'loading-ball': style === 'ball',
      'loading-bars': style === 'bars',
      'loading-infinity': style === 'infinity',
      'loading-xs': size === 'xs',
      'loading-sm': size === 'sm',
      'loading-md': size === 'md',
      'loading-lg': size === 'lg',
      'loading-xl': size === 'xl',
    })
  )
  return <span className={classes}></span>
}