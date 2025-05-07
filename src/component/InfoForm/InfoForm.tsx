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

  const {register, handleSubmit} = useForm<TDefault>({defaultValues:{
    title: '刑案照片黏貼表',
    remark: '時間：年月日時分\n地點：XX市\n說明：嫌疑人OOO',
    }});

  const onSubmit: SubmitHandler<TDefault> = (formData) => {
    setDefaultInfo(formData);
    toast.success('儲存成功');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex'>
      <div className='mx-auto'>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend">自訂文字</legend>
          <TextInput name='title' label={'檔案標題'} register={register}/>
          {/*<TextInput name='remark' label={'預設說明'} register={register}/>*/}
          <label htmlFor='remark' className="label">圖片的預設說明</label>
          <textarea id='remark' className="textarea textarea-sm" placeholder="可輸入多行" {...register('remark')}></textarea>
          <button className="btn btn-neutral mt-2">儲存</button>
        </fieldset>
      </div>
    </form>
  )
}

