import {CustomImage} from "./utils/type.ts";
export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        send_images(data: { title: string, images: Array<CustomImage> }): Promise<{ status: number, message: string }>
      },
    };
  }
}