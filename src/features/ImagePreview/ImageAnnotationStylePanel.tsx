import {useId, useState} from 'react'
import clsx from 'clsx'
import {LuChevronDown, LuTrash2, LuX} from 'react-icons/lu'
import type {ImageAnnotation} from '@/types/project.ts'
import {ANNOTATION_STROKE_WIDTHS, isAnnotationStrokeWidthLevel} from './annotationGeometry.ts'

type Props = {
  readonly selectedAnnotation?: ImageAnnotation
  readonly disabled?: boolean
  readonly onClearSelection?: () => void
  readonly onUpdateAnnotation?: (annotation: ImageAnnotation) => void
  readonly onDeleteAnnotation?: () => void
}
const COLORS = [
  {value: '#ef4444', label: '紅色'},
  {value: '#f59e0b', label: '黃色'},
  {value: '#22c55e', label: '綠色'},
  {value: '#3b82f6', label: '藍色'},
  {value: '#ffffff', label: '白色'},
  {value: '#262626', label: '黑色'},
] as const

type ColorField = 'stroke' | 'fill'

export default function ImageAnnotationStylePanel({selectedAnnotation, disabled = false, onClearSelection, onUpdateAnnotation, onDeleteAnnotation}: Props) {
  const id = useId()
  const [openColor, setOpenColor] = useState<ColorField | null>(null)
  if (!selectedAnnotation) return null
  const supportsFill = 'fill' in selectedAnnotation
  const setColor = (field: ColorField, value: string | null) => {
    if (disabled) return
    if (field === 'stroke' && value !== null) onUpdateAnnotation?.({...selectedAnnotation, stroke: value})
    if (field === 'fill' && 'fill' in selectedAnnotation) onUpdateAnnotation?.({...selectedAnnotation, fill: value})
  }
  const colorControl = (field: ColorField, label: string) => {
    const value = field === 'stroke' ? selectedAnnotation.stroke : 'fill' in selectedAnnotation ? selectedAnnotation.fill : null
    const open = openColor === field
    return <div className='flex items-center gap-1.5 text-xs'>
      <span id={`${id}-${field}-label`} className='text-base-content/60'>{label}</span>
      <button type='button' aria-label={`${label}顏色選單`} aria-expanded={open} aria-controls={open ? `${id}-${field}-picker` : undefined}
              disabled={disabled} className='flex h-8 items-center gap-1.5 rounded-md border border-base-300 bg-base-100 px-2'
              onClick={() => { if (!disabled) setOpenColor(open ? null : field) }}>
        <span aria-hidden='true' className={clsx('size-4 rounded-sm border border-base-content/25', value === null && 'annotation-no-fill')}
              style={value === null ? undefined : {backgroundColor: value}}/>
        <LuChevronDown className='size-3 text-base-content/60' aria-hidden='true'/>
      </button>
      {open && <div id={`${id}-${field}-picker`} role='group' aria-labelledby={`${id}-${field}-label`}
                    className='absolute right-0 top-full z-10 mt-2 w-52 max-w-full rounded-xl border border-base-300 bg-base-100 p-3 shadow-lg'>
        {field === 'fill' && <button type='button' aria-label='無填滿' aria-pressed={value === null} disabled={disabled}
          className={clsx('mb-3 flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs', value === null ? 'border-primary bg-primary/10 text-primary' : 'border-base-300')}
          onClick={() => setColor('fill', null)}><span className='annotation-no-fill size-3 rounded-sm border border-base-content/25' aria-hidden='true'/>無填滿</button>}
        <div className='flex flex-wrap justify-between gap-2'>
          {COLORS.map(color => <button key={color.value} type='button' aria-label={`${label}顏色：${color.label}`}
            aria-pressed={value === color.value} disabled={disabled}
            className={clsx('size-5 shrink-0 rounded-full border border-base-content/30', value === color.value && 'outline-2 outline-offset-2 outline-primary')}
            style={{backgroundColor: color.value}} onClick={() => setColor(field, color.value)}/>)}
        </div>
        <div className='mt-3 flex items-center justify-between gap-2'>
          <label htmlFor={`${id}-${field}`} className='text-xs text-base-content/60'>自訂顏色</label>
          <input id={`${id}-${field}`} type='color' aria-label={`${label}顏色`} disabled={disabled} value={value ?? '#ef4444'}
                 className='h-7 w-9 cursor-pointer rounded border border-base-300 bg-base-100 p-0.5'
                 onChange={event => setColor(field, event.target.value)}/>
        </div>
      </div>}
    </div>
  }

  return <div role='group' aria-label='標記樣式' data-annotation-style-panel='true'
              className='pointer-events-auto relative flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 shadow-lg'
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenColor(null) }}
              onKeyDown={event => {
                if (event.key.startsWith('Arrow')) event.stopPropagation()
                if (event.key !== 'Escape') return
                event.stopPropagation()
                const tag = (event.target as HTMLElement).tagName
                if (tag === 'SELECT' || tag === 'INPUT') return
                event.preventDefault()
                if (openColor) setOpenColor(null)
                else if (!disabled) onClearSelection?.()
              }}>
    <button type='button' aria-label='取消選取' title='取消選取' disabled={disabled}
            className='btn btn-square btn-ghost h-8 min-h-8 w-8 shrink-0 text-base-content/60'
            onClick={() => { if (!disabled) onClearSelection?.() }}><LuX className='size-4' aria-hidden='true'/></button>
    <div className='flex items-center gap-2 text-xs'>
      <label htmlFor={`${id}-width`} className='text-base-content/60'>粗細</label>
      <select id={`${id}-width`} aria-label='框線粗細' disabled={disabled} value={selectedAnnotation.strokeWidthLevel ?? 3}
              className='select select-sm h-8 min-h-8 w-24 rounded-md border-base-300 bg-base-100 text-xs'
              onChange={event => {
                const level = Number(event.target.value)
                if (!disabled && isAnnotationStrokeWidthLevel(level)) onUpdateAnnotation?.({...selectedAnnotation, strokeWidthLevel: level})
              }}>
        {ANNOTATION_STROKE_WIDTHS.map(option => <option key={option.level} value={option.level}>{option.label}</option>)}
      </select>
    </div>
    {colorControl('stroke', '框線')}
    {supportsFill && colorControl('fill', '填滿')}
    <div className='ml-auto border-l border-base-300 pl-2'>
      <button type='button' aria-label='刪除標記' title='刪除標記' disabled={disabled}
              className='btn btn-square btn-ghost h-8 min-h-8 w-8 text-error hover:bg-error/10'
              onClick={() => { if (!disabled) onDeleteAnnotation?.() }}><LuTrash2 className='size-4' aria-hidden='true'/></button>
    </div>
  </div>
}
