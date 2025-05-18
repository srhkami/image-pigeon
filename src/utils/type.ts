export type Response<T> = {
  status: number,
  message: string,
  data: T,
}

export type TOutputData = {
  title: string,
  images: Array<CustomImage>,
  min_size: number,
  mode: number,
  quality: 100 | 90 | 80 | 70,
  align_vertical: 'top' | 'center',
  font_size: '10' | '11' | '12' | '13' | '14',
  path: string,
}

export type TSelectPath = {
  mode: 'word' | 'images',
  title?: string,
}

export class CustomImage {
  file: File | null;
  preview: string;
  remark: string;

  base64: string | null = null; // 新增的欄位
  width: number | null = null;
  height: number | null = null;
  rotation: 0 | 90 | 180 | 270 = 0; // 預設角度為 0

  constructor(file: File | null, remark: string) {
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
          this.base64 = canvas.toDataURL(this.file?.type);
        }
        resolve(this);
      };
      img.src = this.preview;
    });
  }

  /* 從base64轉換 */
  static async fromBase64(data: {
    base64: string,
    width: number,
    height: number,
  }, remark: string): Promise<CustomImage> {
    const customImage = new CustomImage(null, remark);
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
      width,
      height,
    }, img1.remark);
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

export type TVersionCheck = {
  version: string,
  changelog: string,
  url: string,
}

export type TVersionObject = {
  version: string,
  date: string,
  logs: Array<{ color: 'new' | 'info' | 'fix', text: string }>,
}