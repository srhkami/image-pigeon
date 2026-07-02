import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, type WheelEvent} from 'react'
import {CustomImage} from '@/utils/type.ts'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import FocusImageCard from '@/features/ImagePreview/FocusImageCard.tsx'

type Props = {
  readonly viewModels: ProjectItemViewModel[]
  readonly activeItemId: string | null
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
}

const WHEEL_THRESHOLD = 70

export default function FocusImageEditor({viewModels, activeItemId, setActiveItemId, setProject, setImages}: Props) {
  const activeItemIndex = useMemo(() => {
    if (!activeItemId) {
      return -1
    }
    return viewModels.findIndex((item) => item.itemId === activeItemId)
  }, [viewModels, activeItemId])

  const wheelAccumulatorRef = useRef(0)

  const setActiveByOffset = useCallback((offset: number) => {
    if (activeItemIndex < 0 || !viewModels.length) return
    const nextIndex = Math.min(viewModels.length - 1, Math.max(0, activeItemIndex + offset))
    if (nextIndex === activeItemIndex) return
    setActiveItemId(viewModels[nextIndex]?.itemId ?? null)
  }, [activeItemIndex, setActiveItemId, viewModels])

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!viewModels.length || activeItemIndex < 0) return
    wheelAccumulatorRef.current += event.deltaY

    if (wheelAccumulatorRef.current >= WHEEL_THRESHOLD) {
      const steps = Math.floor(wheelAccumulatorRef.current / WHEEL_THRESHOLD)
      setActiveByOffset(steps)
      wheelAccumulatorRef.current -= steps * WHEEL_THRESHOLD
      if (event.deltaY > 0) {
        event.preventDefault()
      }
      return
    }

    if (wheelAccumulatorRef.current <= -WHEEL_THRESHOLD) {
      const steps = Math.floor(Math.abs(wheelAccumulatorRef.current) / WHEEL_THRESHOLD)
      setActiveByOffset(-steps)
      wheelAccumulatorRef.current += steps * WHEEL_THRESHOLD
      if (event.deltaY < 0) {
        event.preventDefault()
      }
    }
  }

  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }
      return target.isContentEditable
        || target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
    }

    const onKeydown = (event: KeyboardEvent) => {
      if (!viewModels.length || activeItemIndex < 0) return
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      if (isEditable(event.target)) return

      event.preventDefault()
      if (event.key === 'ArrowUp') {
        setActiveByOffset(-1)
        return
      }

      setActiveByOffset(1)
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [activeItemIndex, setActiveByOffset, viewModels.length])

  useEffect(() => {
    wheelAccumulatorRef.current = 0
  }, [activeItemId])

  if (activeItemIndex < 0 || !viewModels.length) {
    return null
  }

  const visibleSlots = [-2, -1, 0, 1, 2].map((offset) => {
    const viewModelIndex = activeItemIndex + offset
    const viewModel = viewModels[viewModelIndex]
    const distance = Math.abs(offset) as 0 | 1 | 2
    return {viewModel, index: viewModelIndex, distance, slotKey: offset}
  })

  return (
    <div className='relative flex h-full min-h-0 w-full flex-col overflow-hidden' onWheel={handleWheel}>
      <div className='grid h-full min-h-0 flex-1 grid-rows-5 overflow-hidden pt-10'>
        {visibleSlots.map(({index: viewModelIndex, distance, slotKey, viewModel}) => (
          <div key={slotKey} className='flex min-h-0 items-center justify-center overflow-visible'>
            {viewModel && (
              <FocusImageCard
                viewModel={viewModel}
                distance={distance}
                index={viewModelIndex}
                setProject={setProject}
                setImages={setImages}
                isActive={viewModelIndex === activeItemIndex}
                onActivate={() => setActiveItemId(viewModel.itemId)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
