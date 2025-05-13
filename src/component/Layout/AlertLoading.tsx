export default function AlertLoading() {
  return (
    <div className='alert mx-auto flex justify-center items-center text-warning'>
      <span className="loading loading-bars loading-xl"></span>
      <span className='text-lg'>處理中請稍後</span>
    </div>
  )
}