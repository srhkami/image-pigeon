import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {CustomImage} from "@/utils/type.ts";
import {Button} from "@/component";
import {FaXmark} from "react-icons/fa6";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";
import {CgMenuGridR} from "react-icons/cg";
import {Dispatch, SetStateAction} from "react";

type Props = {
  readonly id: string,
  readonly img: CustomImage,
  readonly index: number,
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
}

/**
 * 專門用來提供排序用的圖卡
 * @param id
 * @param img
 * @param index
 * @param setImages
 * @constructor
 */
export default function ImageCardForMove({id, img, index, setImages}: Props) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({id})

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  // 移除圖片
  const handleRemoveImage = () => {
    setImages(prev => {
      // 釋放 memory
      URL.revokeObjectURL(prev[index].preview);
      // 移除該圖
      return prev.filter((_, i) => i !== index);
    });
  };

  const classes = twMerge(
    'relative rounded-2xl bg-base-100 border shadow-sm my-2 p-2 flex items-center gap-2',
    clsx({
      'border-2 border-accent z-20 opacity-95 backdrop-blur-lg': isDragging,
    })
  )

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={classes}
    >

      <div className='rounded-tr flex flex-col z-10'>
        <button {...listeners} className="btn btn-accent btn-lg btn-ghost btn-circle cursor-grab">
          <CgMenuGridR className='text-lg'/>
        </button>
      </div>
      <div className='sticky bottom-0'>
        {index + 1}
      </div>
      <figure className=' aspect-video h-32 max-w-xl overflow-hidden'>
        <div className="inset-0 flex items-center justify-center"
             style={{
               transform: `rotate(${img.rotation}deg)`,
               transformOrigin: 'center',
             }}>
          <img
            src={img.preview}
            alt={img.remark}
            className="object-contain max-w-full max-h-full"
          />
        </div>
      </figure>
      <div>
        <Button color='error' style='ghost' shape='circle' onClick={handleRemoveImage}>
          <FaXmark className='text-lg'/>
        </Button>
      </div>
    </div>
  )
}