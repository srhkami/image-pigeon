export type TDefault = {
  title: string;
  remark: string;
};

export type Response<T> = {
  status: number,
  message: string,
  data: T,
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

  /* 修改說明 */
  editRemark(newRemark: string) {
    this.remark = newRemark;
  }

  /* 修改角度 */
  setRotation(value: 0 | 90 | 180 | 270) {
    this.rotation = value; // 角度保持在 0~359
  }
}
