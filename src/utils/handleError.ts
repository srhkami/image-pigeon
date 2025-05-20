import {Response} from "./type.ts";

/* 檢查返回的狀態，如果不是200，則拋出錯誤訊息 */
export function checkStatus(res: Response<any>) {
  if (res.status !== 200) {
    console.log(res.message);
    throw new Error(res.message)
  }
}