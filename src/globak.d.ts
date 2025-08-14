import {
  CustomImage,
  Response,
  TOutputData,
  TSelectPath,
  UploadImages
} from "./utils/type.ts";

export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        upload_image(data: UploadImages): Promise<Response<Array<{ base64: string, width: number, height: number }>>>

        crop_image(image: CustomImage): Promise<Response<Array<{ base64: string, width: number, height: number }>>>,
        save_docx(data: TOutputData): Promise<Response<null>>,

        save_images(data: TOutputData): Promise<Response<null>>,
        save_json(data: TOutputData): Promise<Response<null>>,
        select_path(data: TSelectPath): Promise<Response<null>>,
      },
      updateProgress: (progress: number) => void,
    }
  }
}