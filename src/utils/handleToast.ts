import toast, {Renderable, ValueOrFunction} from "react-hot-toast";

type TOption = {
  baseText?: string,
  loading?: string,
  success?: string,
  error?: ValueOrFunction<Renderable, any>,
}

/* 自定義封裝toast Promise組件
*  可傳入簡易預設文字，或自訂每個值
*  若無傳入其他狀態文字，則預設生成預計的載入中與錯誤提示，而成功不顯示
* */
export async function showToast<T>(
  func: Promise<T> | (() => Promise<T>),
  option?: TOption | null,
) {

  const baseText = option?.baseText ?? '處理';
  const loadingText = option?.loading ?? baseText + '中...';
  const successText = option?.success ?? null;
  const errorText = option?.error ?? baseText + '失敗，請重試';

  return await toast.promise(
    func,
    {
      loading: loadingText,
      success: successText,
      error: errorText,
    }
  )
}