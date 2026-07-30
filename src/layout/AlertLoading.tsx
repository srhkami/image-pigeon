import {Loading} from "@/component";
import {useEffect, useState} from "react";

type Props = {
  readonly count?: number,
}

export default function AlertLoading({count}: Props) {

  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const bridge = window.pywebview
    if (!count || !bridge) return

    // 定義 Python 會調用的全域方法；browser 模式可能沒有 pywebview bridge。
    bridge.updateProgress = (progress) => {
      setProgress(progress);
    };
  }, [count]);

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