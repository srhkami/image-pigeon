import {CustomImage, Response} from "./utils/type.ts";

export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        save_docx(data: {
          title: string,
          images: Array<CustomImage>,
          min_size: number,
          quality: 100 | 90 | 80 | 70,
        }): Promise<Response<null>>,
        crop_image(image: CustomImage): Promise<Response<Array<{ base64: string, width: number, height: number }>>>,
      };
    }
  }
}