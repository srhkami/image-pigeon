import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

export default function CollapseContent({className, children}: Readonly<HTMLAttributes<HTMLDivElement>>) {

  const classes = twMerge(
    'collapse-content',
    className,
  )

  return (
    <div className={classes}>
      {children}
    </div>
  )
}