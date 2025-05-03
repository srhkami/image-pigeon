import "react-day-picker/style.css";
import {SubmitHandler, useForm} from "react-hook-form";
import React from "react";
import {TDefault} from "../../utils/type.ts";
import toast from "react-hot-toast";
import TextInput from "./TextInput.tsx";

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
    <form onSubmit={handleSubmit(onSubmit)} className='flex'>
      <div className='mx-auto'>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend">預設設定</legend>
          <TextInput name='title' label={'預設標題'} register={register}/>
          <TextInput name='time' type='date' label={'預設日期'} register={register}/>
          <TextInput name='palce' label={'預設地點'} register={register}/>
          <TextInput name='remark' label={'預設說明'} register={register}/>
          <p className="label text-gray-500 mt-2">您可以在上傳圖片前賦予預設設定</p>
          <button className="btn btn-neutral mt-2">儲存</button>
        </fieldset>
      </div>
    </form>
  )
}

