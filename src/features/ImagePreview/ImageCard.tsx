import {CustomImage} from '@/utils/type.ts'
import {Button} from '@/component'
import {FaArrowRotateLeft, FaArrowRotateRight, FaXmark} from 'react-icons/fa6'
import {SubmitHandler, useForm} from 'react-hook-form'
import toast from 'react-hot-toast'
import {Dispatch, SetStateAction} from 'react'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import {removeItem, updateItemRemark, updateItemRotation} from '@/state/projectState.ts'

type Props = {
  readonly viewModel: ProjectItemViewModel,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly index: number,
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
}

type RemarkForm = {
  remark: string
}

export default function ImageCard({viewModel, setProject, index, setImages}: Props) {
  const {register, getValues} = useForm<RemarkForm>({defaultValues: {remark: viewModel.remark}})

  // 修改圖片備註
  const onRemarkEdit: SubmitHandler<RemarkForm> = () => {
    const {remark} = getValues()
    setProject((prev) => updateItemRemark(prev, viewModel.itemId, remark))
    setImages(prev => prev.map((imgItem) => {
      if (imgItem.id === viewModel.itemId) {
        imgItem.editRemark(remark)
      }
      return imgItem
    }))
    toast.success(`編號${index + 1} 備註已儲存`)
  }

  // 移除圖片
  const handleRemoveImage = () => {
    setProject((prev) => removeItem(prev, viewModel.itemId))
    setImages(prev => prev.filter((item) => item.id !== viewModel.itemId))
  }

  // 旋轉照片角度
  const handleRotate = (value: 90 | -90) => {
    const nextRotation = ((viewModel.rotation + value) % 360 + 360) % 360 as 0 | 90 | 180 | 270
    setProject((prev) => updateItemRotation(prev, viewModel.itemId, nextRotation))
    setImages(prev => prev.map((imgItem) => {
      if (imgItem.id === viewModel.itemId) {
        imgItem.setRotation(nextRotation)
      }
      return imgItem
    }))
  }

  const classes =
    'card bg-base-100 border shadow-sm my-2 p-1 md:w-2/3 lg:w-1/2 items-center justify-center w-full'

  return (
    <div className={classes}>
      <div className='absolute top-2 right-2 rounded-tr flex flex-col z-10'>
        <Button color='error' style='ghost' shape='circle' onClick={handleRemoveImage}>
          <FaXmark className='text-lg'/>
        </Button>
        <div className='divider my-1'></div>
        <Button color='info' style='ghost' shape='circle' title='順時針旋轉'
                onClick={() => handleRotate(90)}>
          <FaArrowRotateRight/>
        </Button>
        <Button color='info' style='ghost' shape='circle' title='逆時針旋轉'
                onClick={() => handleRotate(-90)}>
          <FaArrowRotateLeft/>
        </Button>
      </div>
      <figure className='relative aspect-video w-full max-w-xl overflow-hidden'>
        <div className="absolute inset-0 flex items-center justify-center"
             style={{
               transform: `rotate(${viewModel.rotation}deg)`,
               transformOrigin: 'center',
             }}>
          <img
            src={viewModel.previewUrl}
            alt={viewModel.remark}
            className="object-contain max-w-full max-h-full"
          />
        </div>
      </figure>
      <hr/>
      <div className='divider my-1'>
        <span>編號</span>
        <span className='font-semibold'>{index + 1} </span>
      </div>
      <div className="w-full p-2">
        <form>
          <div>
            <textarea id='remark' className="textarea textarea-sm w-full"
                      placeholder="可輸入多行" {...register('remark', {onBlur: onRemarkEdit})}>
            </textarea>
          </div>
        </form>
      </div>
    </div>
  )
}
