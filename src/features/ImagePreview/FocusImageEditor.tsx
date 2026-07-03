import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {CustomImage} from '@/utils/type.ts'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import FocusImageCard from '@/features/ImagePreview/FocusImageCard.tsx'

export type FocusSwitchDirection = 'previous' | 'next' | null

type Props = {
  readonly viewModels: ProjectItemViewModel[]
  readonly activeItemId: string | null
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
}

export default function FocusImageEditor({viewModels, activeItemId, setActiveItemId, setProject, setImages}: Props) {
  const previousActiveItemIndexRef = useRef<number | null>(null)
  const [switchDirection, setSwitchDirection] = useState<FocusSwitchDirection>(null)

  const activeItemIndex = useMemo(() => {
    if (!activeItemId) {
      return -1
    }
    return viewModels.findIndex((item) => item.itemId === activeItemId)
  }, [viewModels, activeItemId])

  useEffect(() => {
    if (activeItemIndex < 0) {
      previousActiveItemIndexRef.current = null
      setSwitchDirection(null)
      return
    }

    const previousActiveItemIndex = previousActiveItemIndexRef.current
    previousActiveItemIndexRef.current = activeItemIndex

    if (previousActiveItemIndex === null || previousActiveItemIndex === activeItemIndex) {
      return
    }

    setSwitchDirection(activeItemIndex > previousActiveItemIndex ? 'next' : 'previous')
  }, [activeItemIndex])

  const setActiveByOffset = useCallback((offset: number) => {
    if (activeItemIndex < 0 || !viewModels.length) return
    const nextIndex = Math.min(viewModels.length - 1, Math.max(0, activeItemIndex + offset))
    if (nextIndex === activeItemIndex) return
    setActiveItemId(viewModels[nextIndex]?.itemId ?? null)
  }, [activeItemIndex, setActiveItemId, viewModels])


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
    <div className='relative flex h-full min-h-0 w-full flex-col overflow-hidden'>
      <div className='grid h-full min-h-0 flex-1 grid-rows-5 overflow-hidden pt-10'>
        {visibleSlots.map(({index: viewModelIndex, distance, slotKey, viewModel}) => (
          <div key={slotKey} className='flex min-h-0 items-center justify-center overflow-visible'>
            {viewModel && (
              <FocusImageCard
                key={viewModel.itemId}
                viewModel={viewModel}
                distance={distance}
                slotOffset={slotKey}
                switchDirection={switchDirection}
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
