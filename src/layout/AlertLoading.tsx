import {Loading} from "@/component";
import {useEffect, useState} from "react";

type Props = {
  readonly count?: number,
}

export default function AlertLoading({count}: Props) {

  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (count) {
      // 定義 Python 會調用的全域方法
      window.pywebview.updateProgress = (progress) => {
        setProgress(progress);
      };
    }
  }, []);

  return (
    <div className='alert mx-auto flex flex-col justify-center items-center text-error w-full'>
      <div className='flex items-center'>
        <Loading size='xl' style='bars'/>
        <span className='text-lg ml-4'>處理中請稍後</span>
      </div>
      {count && <progress className="progress progress-info w-full" value={progress} max={count}></progress>}
    </div>
  )
}