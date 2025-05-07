export type TDefault = {
  title: string;
  remark: string;
};

export class CustomImage {
  file: File;
  preview: string;
  remark: string;

  base64: string | null = null; // 新增的欄位
  width: number | null = null;
  height: number | null = null;
  rotation: 0 | 90 | 180 | 270 = 0; // 預設角度為 0


  constructor(file: File, remark: string) {
    this.file = file;
    this.preview = URL.createObjectURL(file);
    this.remark = remark;

    this.loadImageDimensions();
  }

  private loadImageDimensions() {
    const img = new Image();
    img.onload = () => {
      this.width = img.width;
      this.height = img.height;

      // 建立 canvas 並轉換成 base64
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        this.base64 = canvas.toDataURL(this.file.type); // 例如 image/png
      }
    };

    img.src = this.preview;
  }

  editRemark(newRemark: string) {
    this.remark = newRemark;
  }

  setRotation(value: 0 | 90 | 180 | 270) {
    this.rotation = value; // 角度保持在 0~359
  }
}
