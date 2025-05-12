import axios from "axios";
import {TVersionCheck} from "./type.ts";

export const AppVersion = '1140512.1'

/* 檢查新版本 */
export const handleCheckVersion = async () => {
  const res = await axios({
    method: 'GET',
    url: 'https://api.trafficpigeon.com/api/app/image/latest/',
  })
  return res.data as TVersionCheck
}