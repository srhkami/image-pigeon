import {SubmitHandler, useForm} from "react-hook-form";
import {MdDeleteForever} from "react-icons/md";
import {FaRegEdit, FaCaretSquareUp, FaCaretSquareDown} from "react-icons/fa";
import React from "react";
import {CustomImage} from "../../utils/type.ts";
import toast from "react-hot-toast";

type Props = {
  readonly img: CustomImage,
  readonly index: number,
  readonly images: CustomImage[],
  readonly setImages: React.Dispatch<React.SetStateAction<CustomImage[]>>
}

export default function ImageCardForm({img, index, images, setImages}: Props) {

  const {register, handleSubmit} = useForm<CustomImage>({values: img});

  const handleRemoveImage = () => {
    setImages(prev => {
      // 釋放 memory
      URL.revokeObjectURL(prev[index].preview);
      // 移除該圖
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleEditImage: SubmitHandler<CustomImage> = (formData) => {
    setImages(prev => {
      // 篩選出這個項目進行修改
      return prev.map((imgItem, i) => {
        if (i === index) {
          imgItem.editTime(formData.time);
          imgItem.editPlace(formData.place);
          imgItem.editRemark(formData.remark);
        }
        return imgItem;
      });
    });
    toast.success('儲存成功');
  };

  const handleUp = () => {
    // 項目往上移
    const updateList = [...images];
    if (index !== 0) {
      [updateList[index], updateList[index - 1]] = [updateList[index - 1], updateList[index]]
    }
    setImages(updateList);
  }

  const handleDown = () => {
    // 項目往下移
    const updateList = [...images];
    if (index !== updateList.length - 1) {
      [updateList[index], updateList[index + 1]] = [updateList[index + 1], updateList[index]]
    }
    setImages(updateList);
  }

  return (
    <div className="card bg-base-100 border shadow-sm my-2 mx-auto p-1 w-1/2 h-96" >
      <div className='absolute top-0 left-0 bg-white text-black opacity-75 rounded-tl'>
        <span className='text-sm mr-1'>編號</span>
        <span className='font-semibold'>{index + 1} </span>
      </div>
      <div className='absolute top-0 right-1 rounded-tr flex flex-col'>
        <button className='btn btn-sm btn-soft btn-info my-1' onClick={handleUp} title='上移'><FaCaretSquareUp/>
        </button>
        <button className='btn btn-sm btn-soft btn-info' onClick={handleDown} title='下移'><FaCaretSquareDown/></button>
      </div>
      <figure className='justify-center items-center flex'>
        <img
          src={img.preview}
          alt={img.remark}
          className=''
          // style={{maxWidth: '720px', maxHeight: '405px'}}
        />
      </figure>
      <hr/>
      <div className="p-2">
        <form onSubmit={handleSubmit(handleEditImage)}>
          <table className='w-full'>
            <tbody>
            <tr>
              <th className='px-1 text-end py-1' style={{width: '6rem'}}>攝影時間：</th>
              <td className='py-1 flex justify-start'>
                <input type="text" className="input input-xs" {...register('time')}/>
              </td>
            </tr>
            <tr className='py-1'>
              <th className='px-1 text-end py-1'>攝影地點：</th>
              <td className='py-1 flex justify-start'>
                <input type="text" className="input input-xs" {...register('place')}/>
              </td>
            </tr>
            <tr className='py-1'>
              <th className='px-1 text-end py-1'>說明：</th>
              <td className='py-1 flex justify-start'>
                <input type="text" className="input input-xs" {...register('remark')}/>
              </td>
            </tr>
            </tbody>
          </table>
          <div className="card-actions justify-between">
            <button type='button' className='btn btn-sm btn-soft btn-error' onClick={handleRemoveImage}>
              <MdDeleteForever className='text-lg'/>刪除
            </button>
            <button type='submit' className='btn btn-sm btn-soft btn-accent'>
              <FaRegEdit/>儲存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}