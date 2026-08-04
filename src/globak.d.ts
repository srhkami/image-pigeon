import {
  Response,
  TSelectPath,
  OutputBaseData,
  UploadImage,
  OutputWord,
  SaveAsImages, base64Image
} from "./utils/type.ts";
import type {FrontendDiagnostic} from "./services/diagnosticLog.ts";

export {};

/* 自訂的全局類別，用來定義API接口格式 */
declare global {
  interface Window {
    pywebview: {
      api: {
        record_frontend_diagnostic(data: FrontendDiagnostic): Promise<Response<null>>,
        /** legacy: Phase 5B 改為 FastAPI multipart 上傳，僅保留舊版 pywebview 匯入相容 */
        upload_image(data: UploadImage): Promise<Response<base64Image>>
        /** legacy: Phase 5B 改為 FastAPI 長截圖 import API，僅保留舊版 pywebview 相容 */
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
