import {Alert, Button, Col, FormInputCol, Row} from '@/component'
import {SubmitHandler, useForm} from 'react-hook-form'
import {FiPrinter} from 'react-icons/fi'
import {IoMdAlert} from 'react-icons/io'
import {ProjectV2} from '@/types/project.ts'
import {PrintAlignVertical, PrintFontSize, PrintPreviewOptions} from '@/features/PrintPreview/printLayout.ts'

type PrintPreviewForm = {
  title: string
  alignVertical: PrintAlignVertical
  fontSize: PrintFontSize
}

type Props = {
  readonly project: ProjectV2
  readonly itemCount: number
  readonly onCloseModal: () => void
  readonly onEnterPrintPreview: (options: PrintPreviewOptions) => void
}

export default function PrintPreviewOutput({
  project,
  itemCount,
  onCloseModal,
  onEnterPrintPreview,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<PrintPreviewForm>({
    defaultValues: {
      title: project.document.title || '照片黏貼表',
      alignVertical: 'center',
      fontSize: '18',
    },
  })

  const onPreview: SubmitHandler<PrintPreviewForm> = (formData) => {
    onCloseModal()
    onEnterPrintPreview({
      title: formData.title.trim() || '照片黏貼表',
      alignVertical: formData.alignVertical,
      fontSize: formData.fontSize,
    })
  }

  return (
    <Row>
      <Col xs={12}>
        <Alert color='info'>
          <IoMdAlert className='text-lg'/>
          不用匯出 WORD，直接透過瀏覽器預覽並列印
        </Alert>
      </Col>
      <FormInputCol xs={12} label='文件標題' error={errors.title?.message}>
        <input
          type='text'
          className='input w-full'
          {...register('title', {required: '請填寫文件標題'})}
        />
      </FormInputCol>
      <FormInputCol xs={6} label='說明文字對齊' error={errors.alignVertical?.message}>
        <select className='select w-full' id='print_align_vertical' {...register('alignVertical')}>
          <option value='top'>垂直置頂</option>
          <option value='center'>垂直置中</option>
        </select>
      </FormInputCol>
      <FormInputCol xs={6} label='字體大小' error={errors.fontSize?.message}>
        <select className='select w-full' id='print_font_size' {...register('fontSize')}>
          <option value='16'>16（小）</option>
          <option value='18'>18（中）</option>
          <option value='20'>20（大）</option>
        </select>
      </FormInputCol>
      <Col xs={12} className='mt-6'>
        <Button
          color='primary'
          shape='block'
          onClick={handleSubmit(onPreview)}
          disabled={itemCount === 0}
        >
          <FiPrinter/>
          開啟預覽列印
        </Button>
      </Col>
    </Row>
  )
}
