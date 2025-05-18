import {Response} from "./type.ts";
import toast from "react-hot-toast";

/* 檢查返回的狀態，如果不是200，則拋出錯誤 */
export function checkStatus(res: Response<any>) {
  if (res.status !== 200) {
    toast.dismiss();
    toast.error(res.message);
    throw new Error(res.message)
  }
}