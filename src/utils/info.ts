import axios from "axios";
import {TVersionCheck} from "./type.ts";

export const AppVersion = 'bata1140512.1'

/* 檢查新版本 */
export const handleCheckVersion = async () => {
  const res = await axios({
    method: 'GET',
    url: 'https://t.trafficpigeon.com/api/app/image/latest/',
    // url: 'http://127.0.0.1:8000/api/app/image/latest/',
  })
  return res.data as TVersionCheck
}