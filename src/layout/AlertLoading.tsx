import {Loading} from "@/component";

type Props = {
  readonly count?: number,
}

export default function AlertLoading({count}: Props) {
  return (
    <div className='alert mx-auto flex flex-col justify-center items-center text-error w-full'>
      <div className='flex items-center'>
        <Loading size='xl' style='bars'/>
        <span className='text-lg ml-4'>處理中請稍後</span>
      </div>
      {count ? <span className='text-sm'>共 {count} 張，完成後會自動更新</span> : null}
    </div>
  )
}