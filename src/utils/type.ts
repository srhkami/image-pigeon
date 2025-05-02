export type TDefault = {
  title: string;
  remark: string;
  time: string;
};

export class CustomImage {
  file: File;
  preview: string;
  remark: string;
  time: string;

  constructor(file: File, remark: string, time: string) {
    this.file = file;
    this.preview = URL.createObjectURL(file);
    this.remark = remark;
    this.time = time;
  }

  changeTime(newTime: string) {
    this.remark = newTime;
  }

  changeRemark(newRemark: string) {
    this.remark = newRemark;
  }
}
