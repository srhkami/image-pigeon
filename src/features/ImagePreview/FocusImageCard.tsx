import {Dispatch, SetStateAction, useEffect} from 'react'
import {SubmitHandler, useForm} from 'react-hook-form'
import {CustomImage} from '@/utils/type.ts'
import {FaArrowRotateLeft, FaArrowRotateRight, FaXmark} from 'react-icons/fa6'
import clsx from 'clsx'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import {removeItem, updateItemLayoutPreference, updateItemRemark, updateItemRotation} from '@/state/projectState.ts'
import {Button} from '@/component'
import type {FocusSwitchDirection} from '@/features/ImagePreview/FocusImageEditor.tsx'

type Props = {
  readonly viewModel: ProjectItemViewModel;
  readonly distance: 0 | 1 | 2;
  readonly slotOffset: number;
  readonly switchDirection: FocusSwitchDirection;
  readonly index: number;
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>;
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>;
  readonly onActivate: () => void;
  readonly isActive: boolean
}
type RemarkForm = { remark: string }
const VISUAL_CLASS: Record<number, string> = {
  0: 'scale-100 opacity-100 blur-0',
  1: 'scale-[0.86] opacity-55 blur-[1px]',
  2: 'scale-[0.74] opacity-20 blur-[2px]'
}
const POSITION_CLASS: Record<number, string> = {
  [-2]: '-translate-y-4',
  [-1]: '-translate-y-2',
  0: 'translate-y-0',
  1: 'translate-y-2',
  2: 'translate-y-4'
}
const LAYOUT_OPTIONS = [['stacked-2', '上下'], ['side-by-side-2', '左右'], ['grid-6', '六張']] as const

export default function FocusImageCard({
                                         viewModel,
                                         distance,
                                         slotOffset,
                                         switchDirection,
                                         index,
                                         setProject,
                                         setImages,
                                         onActivate,
                                         isActive
                                       }: Props) {
  const {register, getValues, reset} = useForm<RemarkForm>({defaultValues: {remark: viewModel.remark}})
  useEffect(() => reset({remark: viewModel.remark}), [reset, viewModel.remark, viewModel.itemId])
  const getNextRotation = (value: 90 | -90) => ((viewModel.rotation + value) % 360 + 360) % 360 as 0 | 90 | 180 | 270
  const remove = () => {
    setProject((prev) => removeItem(prev, viewModel.itemId));
    setImages((prev) => prev.filter((item) => item.id !== viewModel.itemId))
  }
  const rotate = (value: 90 | -90) => {
    const rotation = getNextRotation(value);
    setProject((prev) => updateItemRotation(prev, viewModel.itemId, rotation));
    setImages((prev) => prev.map((image) => {
      if (image.id === viewModel.itemId) image.setRotation(rotation);
      return image
    }))
  }
  const saveRemark: SubmitHandler<RemarkForm> = () => setProject((prev) => updateItemRemark(prev, viewModel.itemId, getValues().remark))


  return <div role={isActive ? 'article' : 'button'} tabIndex={isActive ? undefined : 0}
              className={clsx('card bg-base-100 shadow border transition-all duration-300 flex flex-col items-center gap-2 w-full max-w-2xl', VISUAL_CLASS[distance] ?? VISUAL_CLASS[2], POSITION_CLASS[slotOffset] ?? 'translate-y-0', isActive && switchDirection && `focus-image-card-enter-${switchDirection}`, !isActive && 'cursor-pointer', isActive ? 'z-10' : 'z-0')}
              onClick={() => !isActive && onActivate()}>
    <div className='card-body w-full pt-2 pb-3'>
      <div className='flex items-center justify-between'>
        <span className='badge badge-outline'>#{index + 1}</span>
        {isActive &&
            <button type='button' aria-label='刪除圖片'
                    className='btn btn-circle btn-sm btn-error'
                    onClick={(event) => {
                      event.stopPropagation();
                      remove()
                    }}>
                <FaXmark/>
            </button>}
      </div>
      <figure className='relative aspect-video w-full overflow-hidden rounded-box bg-base-200/20'>
        <div className='absolute inset-0 flex items-center justify-center'
             style={{transform: `rotate(${viewModel.rotation}deg)`, transformOrigin: 'center'}}><img
          src={viewModel.previewUrl} alt={viewModel.remark}
          className={clsx('object-contain max-w-full max-h-full', isActive ? 'max-h-96' : 'max-h-20')}/></div>
      </figure>
      {isActive && <>
          <div className='divider my-1'/>
          <textarea className='textarea textarea-sm w-full'
                    placeholder='可輸入多行' {...register('remark', {onBlur: saveRemark})} />
          <div className='flex flex-wrap items-center gap-2 w-full'><Button color='info' style='ghost'
                                                                            onClick={() => rotate(-90)}><FaArrowRotateLeft/>左轉</Button><Button
              color='info' style='ghost' onClick={() => rotate(90)}><FaArrowRotateRight/>右轉</Button>
              <div className='ml-auto flex flex-wrap gap-1'>{LAYOUT_OPTIONS.map(([value, label]) => <button key={value}
                                                                                                            type='button'
                                                                                                            aria-label={`排版方式：${label}`}
                                                                                                            aria-pressed={viewModel.layoutPreference === value}
                                                                                                            className={clsx('btn', viewModel.layoutPreference === value ? 'btn-primary' : 'btn-ghost')}
                                                                                                            onClick={() => setProject((prev) => updateItemLayoutPreference(prev, viewModel.itemId, value))}>{label}</button>)}</div>
          </div>
      </>}
    </div>
  </div>
}
