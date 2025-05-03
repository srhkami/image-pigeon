export type TDefault = {
  title: string;
  time: string;
  place: string;
  remark: string;
};

export class CustomImage {
  file: File;
  preview: string;
  time: string;
  place: string;
  remark: string;

  constructor(file: File, time: string, place: string, remark: string) {
    this.file = file;
    this.preview = URL.createObjectURL(file);
    this.time = time;
    this.place = place;
    this.remark = remark;
  }

  editTime(newTime: string) {
    this.remark = newTime;
  }

  editPlace(newPlace: string) {
    this.remark = newPlace;
  }

  editRemark(newRemark: string) {
    this.remark = newRemark;
  }
}

