import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

export default function CollapseTitle({className, children}: HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'collapse-title',
    className,
  )

  return (
    <div className={classes}>
      {children}
    </div>
  )
}