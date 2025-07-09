import {Alert, Loading} from "@/component";

export default function AlertLoading() {
  return (
    <Alert className='mx-auto flex justify-center items-center text-error'>
      <Loading size='xl' style='bars'/>
      <span className='text-lg'>處理中請稍後</span>
    </Alert>
  )
}