import {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {CustomImage} from '@/utils/type.ts'
import {AnnotationEditor, ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import FocusImageCard from '@/features/ImagePreview/FocusImageCard.tsx'
import ImageAnnotationStylePanel from './ImageAnnotationStylePanel.tsx'
import {EMPTY_ANNOTATIONS} from './annotationGeometry.ts'
import {Intro} from "@/features";

export type FocusSwitchDirection = 'previous' | 'next' | null

type Props = {
  readonly viewModels: ProjectItemViewModel[]
  readonly activeItemId: string | null
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
  readonly onRemoveItem: (itemId: string) => void
  readonly annotationEditor?: AnnotationEditor
}

export default function FocusImageEditor({viewModels, activeItemId, setActiveItemId, setProject, setImages, onRemoveItem, annotationEditor}: Props) {
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
        || target.tagName === 'SELECT'
    }

    const onKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('[data-annotation-gesture="true"]')) return
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
    return <Intro/>
  }

  const activeAnnotations = viewModels[activeItemIndex].annotations ?? EMPTY_ANNOTATIONS
  const selectedAnnotation = activeAnnotations.find(annotation => annotation.id === annotationEditor?.selectedId)

  const visibleSlots = [-2, -1, 0, 1, 2].map((offset) => {
    const viewModelIndex = activeItemIndex + offset
    const viewModel = viewModels[viewModelIndex]
    const distance = Math.abs(offset) as 0 | 1 | 2
    return {viewModel, index: viewModelIndex, distance, slotKey: offset}
  })

  return (
    <div className='annotation-editor relative flex h-full min-h-0 w-full flex-col overflow-hidden'>
      {annotationEditor && selectedAnnotation && <div className='annotation-style-overlay pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-center'>
        <ImageAnnotationStylePanel key={JSON.stringify([annotationEditor.scope, selectedAnnotation.id])}
          selectedAnnotation={selectedAnnotation}
          onClearSelection={() => annotationEditor.onSelect(null)}
          onUpdateAnnotation={next => annotationEditor.onChange(activeAnnotations.map(annotation => annotation.id === next.id ? next : annotation), activeAnnotations)}
          onDeleteAnnotation={() => {
            annotationEditor.onChange(activeAnnotations.filter(annotation => annotation.id !== selectedAnnotation.id), activeAnnotations)
            annotationEditor.onSelect(null)
          }}/>
      </div>}
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
                onRemoveItem={onRemoveItem}
                isActive={viewModelIndex === activeItemIndex}
                annotationEditor={viewModelIndex === activeItemIndex ? annotationEditor : undefined}
                onActivate={() => setActiveItemId(viewModel.itemId)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
