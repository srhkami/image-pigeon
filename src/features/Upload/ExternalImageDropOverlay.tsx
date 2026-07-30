export default function ExternalImageDropOverlay() {
  return (
    <div className='pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-base-300/75 p-6 backdrop-blur-sm'>
      <div className='rounded-box border-2 border-dashed border-primary bg-base-100 px-10 py-8 text-center shadow-xl'>
        <div className='text-xl font-bold text-primary'>拖曳到此處導入圖片</div>
      </div>
    </div>
  )
}
