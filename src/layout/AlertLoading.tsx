import {Loading} from "@/component";

export default function AlertLoading() {
  return (
    <div className='alert mx-auto flex justify-center items-center text-error w-full'>
      <Loading size='xl' style='bars'/>
      <span className='text-lg'>處理中請稍後</span>
    </div>
  )
}