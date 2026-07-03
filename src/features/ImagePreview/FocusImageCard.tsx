import {Dispatch, SetStateAction, useEffect} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {CustomImage} from '@/utils/type.ts'
import {FaArrowRightArrowLeft, FaArrowRotateLeft, FaArrowRotateRight, FaXmark} from 'react-icons/fa6'
import clsx from 'clsx'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import {removeItem, updateItemPortraitSize, updateItemRemark, updateItemRotation} from '@/state/projectState.ts'
import {Button} from "@/component";
import type {FocusSwitchDirection} from '@/features/ImagePreview/FocusImageEditor.tsx'

type Props = {
  readonly viewModel: ProjectItemViewModel
  readonly distance: 0 | 1 | 2
  readonly slotOffset: number
  readonly switchDirection: FocusSwitchDirection
  readonly index: number
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
  readonly onActivate: () => void
  readonly isActive: boolean
}

type RemarkForm = {
  remark: string
}

const VISUAL_CLASS: Record<number, string> = {
  0: 'scale-100 opacity-100 blur-0',
  1: 'scale-[0.86] opacity-55 blur-[1px]',
  2: 'scale-[0.74] opacity-20 blur-[2px]',
}

const POSITION_CLASS: Record<number, string> = {
  [-2]: '-translate-y-4',
  [-1]: '-translate-y-2',
  0: 'translate-y-0',
  1: 'translate-y-2',
  2: 'translate-y-4',
}

export default function FocusImageCard({
                                         viewModel,
                                         distance,
                                         slotOffset,
                                         switchDirection,
                                         index,
                                         setProject,
                                         setImages,
                                         onActivate,
                                         isActive,
                                       }: Props) {
  const visualClass = VISUAL_CLASS[distance] ?? VISUAL_CLASS[2]
  const positionClass = POSITION_CLASS[slotOffset] ?? 'translate-y-0'
  const activeSwitchAnimationClass = isActive && switchDirection
    ? `focus-image-card-enter-${switchDirection}`
    : ''
  const {register, getValues, reset} = useForm<RemarkForm>({defaultValues: {remark: viewModel.remark}})

  useEffect(() => {
    reset({remark: viewModel.remark})
  }, [reset, viewModel.remark, viewModel.itemId])

  const typeTag = viewModel.orientation === 'landscape'
    ? {label: '橫向', style: 'badge-info'}
    : viewModel.portraitSize === 'small'
      ? {label: '直向小圖', style: 'badge-warning'}
      : {label: '直向大圖', style: 'badge-success'}

  const getNextRotation = (value: 90 | -90) => ((viewModel.rotation + value) % 360 + 360) % 360 as 0 | 90 | 180 | 270

  const onRemarkEdit: SubmitHandler<RemarkForm> = () => {
    const {remark} = getValues()
    setProject((prev) => updateItemRemark(prev, viewModel.itemId, remark))
    setImages((prev) => prev.map((imgItem) => {
      if (imgItem.id === viewModel.itemId) {
        imgItem.editRemark(remark)
      }
      return imgItem
    }))
  }

  const handleRemoveImage = () => {
    setProject((prev) => removeItem(prev, viewModel.itemId))
    setImages((prev) => prev.filter((item) => item.id !== viewModel.itemId))
  }

  const handleRotate = (value: 90 | -90) => {
    const nextRotation = getNextRotation(value)
    setProject((prev) => updateItemRotation(prev, viewModel.itemId, nextRotation))
    setImages((prev) => prev.map((imgItem) => {
      if (imgItem.id === viewModel.itemId) {
        imgItem.setRotation(nextRotation)
      }
      return imgItem
    }))
  }

  const togglePortraitSize = () => {
    const nextPortraitSize = viewModel.portraitSize === 'large' ? 'small' : 'large'
    setProject((prev) => updateItemPortraitSize(prev, viewModel.itemId, nextPortraitSize))
  }

  return (
    <div
      role={isActive ? 'article' : 'button'}
      tabIndex={isActive ? undefined : 0}
      className={[
        'card bg-base-100 shadow border transition-all duration-300 ease-out will-change-transform motion-reduce:transition-none',
        'flex flex-col items-center gap-2',
        'w-full max-w-2xl',
        'hover:shadow-md',
        visualClass,
        positionClass,
        activeSwitchAnimationClass,
        clsx({
          'cursor-pointer': !isActive,
          'cursor-default': isActive,
          'z-10': isActive,
          'z-0': !isActive,
        }),
      ].join(' ')}
      onClick={() => {
        if (!isActive) {
          onActivate()
        }
      }}
    >
      <div className='card-body w-full pt-2 pb-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <span className='badge badge-outline'>#{index + 1}</span>
          <span className={`badge ${typeTag.style}`}>{typeTag.label}</span>
        </div>

        <figure className='relative aspect-video w-full overflow-hidden rounded-box bg-base-200/20'>
          <div
            className='absolute inset-0 flex items-center justify-center'
            style={{
              transform: `rotate(${viewModel.rotation}deg)`,
              transformOrigin: 'center',
            }}
          >
            <img
              src={viewModel.previewUrl}
              alt={viewModel.remark}
              className={clsx(
                'object-contain max-w-full max-h-full',
                isActive ? 'max-h-96' : 'max-h-20'
              )}
            />
          </div>
        </figure>

        {isActive && (
          <div className='divider my-1'/>
        )}

        {isActive && (
          <>
            <div className='w-full'>
              <textarea
                className='textarea textarea-sm w-full'
                placeholder='可輸入多行'
                {...register('remark', {onBlur: onRemarkEdit})}
              />
            </div>
            <div className='flex flex-wrap items-center gap-2 w-full'>
              <Button color='info' style='ghost' onClick={() => handleRotate(-90)}>
                <FaArrowRotateLeft/>
                左轉
              </Button>
              <Button color='info' style='ghost' onClick={() => handleRotate(90)}>
                <FaArrowRotateRight/>
                右轉
              </Button>
              {viewModel.orientation === 'portrait' && (
                <Button color='info' style='ghost' onClick={togglePortraitSize}>
                  <FaArrowRightArrowLeft />
                  {viewModel.portraitSize === 'large' ? '切小圖' : '切大圖'}
                </Button>

              )}
              <Button color='error' style='ghost' className='ml-auto' onClick={handleRemoveImage}>
                <FaXmark/>
                刪除
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
