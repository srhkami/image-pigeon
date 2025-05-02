import "react-day-picker/style.css";
import {SubmitHandler, useForm} from "react-hook-form";
import React from "react";
import {TDefault} from "../utils/type.ts";
import toast from "react-hot-toast";

type Props = {
  readonly setDefaultInfo: React.Dispatch<React.SetStateAction<TDefault>>,
}

export default function InfoForm({setDefaultInfo}: Props) {

  const {register, handleSubmit} = useForm<TDefault>();

  const onSubmit: SubmitHandler<TDefault> = (formData) => {
    setDefaultInfo(formData);
    toast.success('儲存成功');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" placeholder="檔案標題" className="input" {...register('title', {required: true})}/>
      <input type="text" placeholder="預設說明" className="input" {...register('remark', {required: true})}/>
      <input type="datetime-local" placeholder="預設時間" className="input" {...register('time', {required: true})}/>
      <button type='submit' className='btn'>儲存</button>
    </form>
  )
}