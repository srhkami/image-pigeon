import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {CustomImage} from "@/utils/type.ts";
import {MdOutlineCallMerge} from "react-icons/md";
import {Button} from "@/component";
import {FaArrowRotateLeft, FaArrowRotateRight, FaXmark} from "react-icons/fa6";
import {SubmitHandler, useForm} from "react-hook-form";
import toast from "react-hot-toast";
import {twMerge} from "tailwind-merge";
import clsx from "clsx";
import { CgMenuGridR } from "react-icons/cg";
import {Dispatch, SetStateAction} from "react";

type Props = {
  readonly id :string,
  readonly img: CustomImage,
  readonly index: number,
  readonly images: CustomImage[],
  readonly setImages: Dispatch<SetStateAction<CustomImage[]>>
}

export default function ImageCard({id, img, index, images, setImages}: Props) {

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

  const {register, getValues} = useForm<CustomImage>({defaultValues: {remark:img.remark}});

  // 修改圖片備註
  const handleEditImage: SubmitHandler<CustomImage> = () => {

    const formData = getValues();
    setImages(prev => {
      // 篩選出這個項目進行修改
      return prev.map((imgItem, i) => {
        if (i === index) {
          imgItem.editRemark(formData.remark);
        }
        return imgItem;
      });
    });
    toast.success(`編號${index + 1} 備註已儲存`);
  };

  // 移除圖片
  const handleRemoveImage = () => {
    setImages(prev => {
      // 釋放 memory
      URL.revokeObjectURL(prev[index].preview);
      // 移除該圖
      return prev.filter((_, i) => i !== index);
    });
  };

  // 旋轉照片角度
  const handleRotate = (value: 90 | -90) => {
    const newRotation = (img.rotation + value) % 360
    img.setRotation(newRotation as 0 | 90 | 180 | 270);
    setImages(prev => {
      // 篩選出這個項目進行修改
      return prev.map((imgItem, i) => {
        if (i === index) {
          imgItem.setRotation(newRotation as 0 | 90 | 180 | 270);
        }
        return imgItem;
      });
    });
  }

  // 確認照片合併
  const handleCheckMerge = () => {
    toast(t => (
      <div className='w-52'>
        <div className='font-bold'>是否將本張圖片與上張圖片合併？</div>
        <div className='text-sm text-error text-start'>此操作無法復原</div>
        <div className='flex justify-end mt-2'>
          <button className='btn btn-sm btn-success' onClick={() => {
            toast.dismiss(t.id);
            handleMerge();
          }}>
            確定
          </button>
          <button className='btn btn-sm ml-2' onClick={() => toast.dismiss(t.id)}>取消
          </button>
        </div>
      </div>
    ))
  }

  // 照片合併
  const handleMerge = async () => {
    if (index === 0) {
      toast.error('沒有上一張圖')
      return
    }
    // 初始化上一張圖片
    const imgA = await images[index - 1].init();
    // 初始化本張圖片
    const imgB = await img.init();
    const mergedImage = await CustomImage.mergeSideBySide(imgA, imgB);
    // 將圖片插入，並移除舊有圖片
    const updatedImages = [
      ...images.slice(0, index - 1),
      mergedImage,
      ...images.slice(index + 1),
    ];
    setImages(updatedImages);
    toast.success('合併成功')
  }

  const classes = twMerge(
    'card bg-base-100 border shadow-sm my-2 p-1 md:w-2/3 lg:w-1/2 items-center justify-center',
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
      <div className='absolute top-2 left-2 rounded-tr flex flex-col z-10'>
        <button {...listeners} className="btn btn-accent btn-ghost btn-circle cursor-grab">
          <CgMenuGridR className='text-lg'/>
        </button>
      </div>
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
        <Button color='info' style='ghost' shape='circle'  title='與上圖合併'
                onClick={handleCheckMerge}>
          <MdOutlineCallMerge className='text-xl'/>
        </Button>
      </div>
      <figure className='relative aspect-video w-full max-w-xl overflow-hidden'>
        <div className="absolute inset-0 flex items-center justify-center"
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
      <hr/>
      <div className='divider my-1'>
        <span>編號</span>
        <span className='font-semibold'>{index + 1} </span>
      </div>
      <div className="w-full p-2">
        <form>
          <div>
            <textarea id='remark' className="textarea textarea-sm w-full"
                      placeholder="可輸入多行" {...register('remark', {onBlur: handleEditImage})}>
            </textarea>
          </div>
        </form>
      </div>
    </div>
  )
}