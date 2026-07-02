import {Dispatch, SetStateAction, type WheelEvent, useCallback, useEffect, useMemo, useRef} from 'react'
import {FaChevronDown, FaChevronUp} from 'react-icons/fa6'
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

  const goPrev = () => setActiveByOffset(-1)
  const goNext = () => setActiveByOffset(1)

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
    return <div className='text-sm text-base-content/55'>請先選擇圖片</div>
  }

  const startIndex = Math.max(0, activeItemIndex - 2)
  const endIndex = Math.min(viewModels.length - 1, activeItemIndex + 2)

  const visibleCards = [] as Array<{viewModel: ProjectItemViewModel, index: number, distance: 0 | 1 | 2}>
  for (let currentIndex = startIndex; currentIndex <= endIndex; currentIndex += 1) {
    const distance = Math.abs(currentIndex - activeItemIndex)
    visibleCards.push({
      viewModel: viewModels[currentIndex],
      index: currentIndex,
      distance: distance > 2 ? 2 : distance as 0 | 1 | 2,
    })
  }

  return (
    <div className='w-full' onWheel={handleWheel}>
      <div className='flex items-center justify-center gap-2 mb-3'>
        <button
          type='button'
          className='btn btn-ghost btn-sm'
          onClick={goPrev}
          disabled={activeItemIndex <= 0}
        >
          <FaChevronUp />
          上一張
        </button>
        <button
          type='button'
          className='btn btn-ghost btn-sm'
          onClick={goNext}
          disabled={activeItemIndex >= viewModels.length - 1}
        >
          下一張
          <FaChevronDown />
        </button>
      </div>

      <div className='flex flex-col items-center gap-3'>
        {visibleCards.map(({index: viewModelIndex, distance, viewModel}) => (
          <FocusImageCard
            key={viewModel.itemId}
            viewModel={viewModel}
            distance={distance}
            index={viewModelIndex}
            setProject={setProject}
            setImages={setImages}
            isActive={viewModelIndex === activeItemIndex}
            onActivate={() => setActiveItemId(viewModel.itemId)}
          />
        ))}
      </div>
    </div>
  )
}
