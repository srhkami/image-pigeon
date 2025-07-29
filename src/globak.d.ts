import {CustomImage, Response, TOutputData, TSelectPath} from "./utils/type.ts";

export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        save_docx(data: TOutputData): Promise<Response<null>>,
        crop_image(image: CustomImage): Promise<Response<Array<{ base64: string, width: number, height: number }>>>,
        save_images(data: TOutputData): Promise<Response<null>>,
        save_json(data: TOutputData): Promise<Response<null>>,
        select_path(data: TSelectPath): Promise<Response<null>>,
      };
    }
  }
}