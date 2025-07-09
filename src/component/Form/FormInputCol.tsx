import Col from "../Row/Col.tsx";
import {HTMLAttributes, ReactNode} from "react";
import {twMerge} from "tailwind-merge";

type Props = {
  children: ReactNode,
  label: string,
  error: string | undefined,
  xs?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;
  md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;
}

export default function FormInputCol({children, className, label, error, xs = 12, md = null}: Props & HTMLAttributes<HTMLDivElement>) {

  const classes = twMerge(
    'mt-4 px-1',
    className
  );

  return (
    <Col xs={xs} md={md} className={classes}>
      <label className="label block text-sm mb-1">{label}</label>
      {children}
      <span className='text-error text-xs'>{error}</span>
    </Col>
  )
}