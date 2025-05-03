import {CustomImage} from "../../utils/type.ts";
import React, {ReactNode} from "react";
import ImageCardForm from "./ImageCardForm.tsx";

type Props = {
  images: CustomImage[],
  setImages: React.Dispatch<React.SetStateAction<CustomImage[]>>
}

export default function ImagePreview({images, setImages}: Props) {

  const imageList: ReactNode[] = images.map((img, index) => (
    <ImageCardForm key={index} img={img} index={index} images={images} setImages={setImages}/>
  ))

  return (
    <div className='flex flex-col'>
      {imageList}
    </div>
  )
}