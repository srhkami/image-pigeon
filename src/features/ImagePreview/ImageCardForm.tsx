import {SubmitHandler, useForm} from "react-hook-form";
import {MdDeleteForever} from "react-icons/md";
import {FaCaretSquareUp, FaCaretSquareDown} from "react-icons/fa";
import {FaArrowRotateRight, FaArrowRotateLeft} from "react-icons/fa6";
import React from "react";
import {CustomImage} from "../../utils/type.ts";
import toast from "react-hot-toast";
import {MdOutlineCallMerge} from "react-icons/md";

type Props = {
  readonly img: CustomImage,
  readonly index: number,
  readonly images: CustomImage[],
  readonly setImages: React.Dispatch<React.SetStateAction<CustomImage[]>>
}

export default function ImageCardForm({img, index, images, setImages}: Props) {

  const {register,getValues } = useForm<CustomImage>({defaultValues: {remark: img.remark}});

  // 修改圖片備註
  const handleEditImage: SubmitHandler<CustomImage> = () => {

    const formData = getValues();
    console.log(formData);
    setImages(prev => {
      // 篩選出這個項目進行修改
      return prev.map((imgItem, i) => {
        if (i === index) {
          imgItem.editRemark(formData.remark);
        }
        return imgItem;
      });
    });
    console.log(images);
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

  // 項目往上移
  const handleUp = () => {
    const updateList = [...images];
    if (index !== 0) {
      [updateList[index], updateList[index - 1]] = [updateList[index - 1], updateList[index]]
    }
    setImages(updateList);
  }

  // 項目往下移
  const handleDown = () => {
    const updateList = [...images];
    if (index !== updateList.length - 1) {
      [updateList[index], updateList[index + 1]] = [updateList[index + 1], updateList[index]]
    }
    setImages(updateList);
  }

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

  const handleCheckMerge = () => {
    toast(t => (
      <div>
        <span className='font-bold'>是否將本張圖片與上張圖片合併？</span>
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

  return (
    <div className="card bg-base-100 border shadow-sm my-2 mx-auto p-1 md:w-2/3 lg:w-1/2 items-center justify-center">
      {/*<div className='absolute top-0 left-0 bg-white text-black opacity-75 rounded-tl z-10'>*/}
      {/*  <span className='text-sm mr-1'>編號</span>*/}
      {/*  <span className='font-semibold'>{index + 1} </span>*/}
      {/*</div>*/}
      <div className='absolute top-0 right-1 rounded-tr flex flex-col z-10'>
        <button type='button' className='btn btn-sm btn-soft btn-error mt-2 mb-1' onClick={handleRemoveImage}>
          <MdDeleteForever className='text-lg'/>
        </button>
        <div className='divider my-1'></div>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={handleUp} title='上移'>
          <FaCaretSquareUp/>
        </button>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={handleDown} title='下移'>
          <FaCaretSquareDown/>
        </button>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={() => handleRotate(90)} title='右旋'>
          <FaArrowRotateRight/>
        </button>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={() => handleRotate(-90)} title='右旋'>
          <FaArrowRotateLeft/>
        </button>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={handleCheckMerge} title='與上圖合併'>
          <MdOutlineCallMerge className='text-xl'/>
        </button>
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
        <span >編號</span>
        <span className='font-semibold'>{index + 1} </span>
      </div>
      <div className="w-full p-2">
        <form>
          <div>
            <textarea id='remark' className="textarea textarea-sm w-full"
                      placeholder="可輸入多行" {...register('remark', {onBlur: handleEditImage})}>
            </textarea>
          </div>
          {/*<div className="card-actions justify-between mt-2">*/}
            {/*<button type='button' className='btn btn-sm btn-soft btn-error' onClick={handleRemoveImage}>*/}
            {/*  <MdDeleteForever className='text-lg'/>刪除*/}
            {/*</button>*/}
            {/*<button type='submit' className='btn btn-sm btn-soft btn-accent'>*/}
            {/*  <FaRegEdit/>儲存修改*/}
            {/*</button>*/}
          {/*</div>*/}
        </form>
      </div>
    </div>
  )
}