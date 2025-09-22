import {
  CustomImage,
  Response,
  TSelectPath,
  OutputBaseData,
  UploadImage,
  OutputWord,
  SaveAsImages, base64Image
} from "./utils/type.ts";

export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        upload_image(data: UploadImage): Promise<Response<base64Image>>
        crop_image(data: UploadImage): Promise<Response<Array<base64Image>>>,
        save_docx(data: OutputWord): Promise<Response<null>>,
        save_images(data: SaveAsImages): Promise<Response<null>>,
        save_json(data: OutputBaseData): Promise<Response<null>>,
        select_path(data: TSelectPath): Promise<Response<null>>,
      },
      updateProgress: (progress: number) => void,
    }
  }
}