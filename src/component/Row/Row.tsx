import {HTMLAttributes} from "react";
import {twMerge} from "tailwind-merge";

export default function Row({children, className}: HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'flex',
    'flex-wrap',
    className,
  )

  return <div className={classes}>{children}</div>
}