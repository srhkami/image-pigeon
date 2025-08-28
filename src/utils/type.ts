export type Response<T> = {
  status: number,
  message: string,
  data: T,
}

export type UploadImage = {
  file: string;
  min_size: number, // 最小尺寸
  quality: '90' | '75' | '50', // 壓縮率
}

export interface OutputBaseData {
  title: string,
  images: Array<CustomImage>,
  path: string,
}

export interface OutputWord extends OutputBaseData {
  mode: '1' | '2' | '6',
  align_vertical: 'top' | 'center',
  font_size: '10' | '11' | '12' | '13' | '14',
}

export interface SaveAsImages extends OutputBaseData {
  is_remark_mode: boolean,
}

export type TSelectPath = {
  mode: 'word' | 'images' | 'json',
  title?: string,
}

export class CustomImage {
  id: string
  file: File | null;
  preview: string; //預覽
  remark: string;

  base64: string | null = null; // 新增的欄位
  width: number | null = null;
  height: number | null = null;
  rotation: 0 | 90 | 180 | 270 = 0; // 預設角度為 0

  constructor(file: File | null, remark: string) {
    this.id = crypto.randomUUID();
    this.file = file;
    this.preview = file ? URL.createObjectURL(file) : '';
    this.remark = remark;
  }

  /* 將File檔案類型的圖片初始化，獲得長、寬、base64 */
  async init(): Promise<this> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.width = img.width;
        this.height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          this.base64 = canvas.toDataURL("image/png");
        }
        resolve(this);
      };
      img.src = this.preview;
    });
  }

  /* 從base64轉換 */
  static async fromBase64(data: base64Image): Promise<CustomImage> {
    const customImage = new CustomImage(null, data.remark);
    customImage.preview = data.base64;
    customImage.base64 = data.base64;
    customImage.width = data.width;
    customImage.height = data.height;
    return customImage;
  }

  /* 將兩張圖片相鄰合併 */
  static async mergeSideBySide(img1: CustomImage, img2: CustomImage): Promise<CustomImage> {
    if (!img1.base64 || !img2.base64) {
      throw new Error("Both images must be initialized (have base64)");
    }

    const image1 = await CustomImage.loadImage(img1.base64);
    const image2 = await CustomImage.loadImage(img2.base64);

    const width = (img1.width || image1.width) + (img2.width || image2.width);
    const height = Math.max(img1.height || image1.height, img2.height || image2.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Cannot get canvas context");

    ctx.drawImage(image1, 0, 0);
    ctx.drawImage(image2, img1.width || image1.width, 0);

    const mergedBase64 = canvas.toDataURL("image/png");

    return await CustomImage.fromBase64({
      base64: mergedBase64,
      width: width,
      height: height,
      remark: img1.remark
    });
  }

  /* 工具方法：將 base64 轉成 HTMLImageElement */
  private static loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  /* 修改說明 */
  editRemark(newRemark: string) {
    this.remark = newRemark;
  }

  /* 修改角度 */
  setRotation(value: 0 | 90 | 180 | 270) {
    this.rotation = value; // 角度保持在 0~359
  }
}

export type VersionCheckData = {
  app_version: string,
  whats_new: string,
  download_link: string,
}

export type TVersionObject = {
  version: string,
  date: string,
  logs: Array<{ color: 'new' | 'info' | 'fix', text: string }>,
}

export type base64Image = {
  base64: string,
  width: number,
  height: number,
  remark: string,
  rotation?: 0 | 90 | 180 | 270,
}