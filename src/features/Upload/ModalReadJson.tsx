import {useModal} from "@/hooks";
import {Button, Modal, ModalBody, ModalHeader} from "@/component";
import {LuImageUp} from "react-icons/lu";
import {z} from "zod";
import {useForm} from "react-hook-form";

const CustomImageSchema = z.object({
  id: z.string(),
  file: z.any().nullable(), // JSON 不會包含 File，所以通常是 null
  preview: z.string(),
  remark: z.string(),
  base64: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).default(0),
});

// TOutputData Schema
const OutputDataSchema = z.object({
  title: z.string(),
  images: z.array(CustomImageSchema),
  min_size: z.number(),
  mode: z.string(),
  quality: z.union([z.literal('100'), z.literal('90'), z.literal('80'), z.literal('70')]),
  align_vertical: z.union([z.literal("top"), z.literal("center")]),
  font_size: z.union([z.literal("10"), z.literal("11"), z.literal("12"), z.literal("13"), z.literal("14")]),
  path: z.string(),
});

// 型別推導
type TOutputData = z.infer<typeof OutputDataSchema>;

type FormValues = {
  file: FileList;
};

export default function ModalReadJson() {

  const {isShow, onShow, onHide} = useModal();

  const {
    register,
    handleSubmit,
    setError,
    formState: {errors},
  } = useForm<FormValues>();


  const onSubmit = async (data: FormValues) => {
    const file = data.file?.[0];
    if (!file) {
      setError("file", {message: "請選擇 JSON 檔案"});
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // 驗證 JSON 是否符合 schema
      const result = OutputDataSchema.safeParse(parsed);
      if (!result.success) {
        setError("file", {message: "JSON 結構不符合要求"});
        console.log(result.error);
        return;
      }

      const jsonData: TOutputData = result.data;
      console.log("成功讀取 JSON：", jsonData);
      // 在這裡可以將 jsonData 送到 API 或處理
    } catch (err) {
      setError("file", {message: "JSON 解析失敗，請檢查檔案格式"});
    }
  };


  return (
    <>
      <Button color='primary' onClick={onShow}>
        讀取存檔
      </Button>
      <Modal isShow={isShow} onHide={onHide} closeButton>
        <ModalHeader className='justify-center text-lg font-bold'>
          <LuImageUp className='mr-2'/>
          <span>讀取專用存檔</span>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
            <input
              type="file"
              accept="application/json"
              {...register("file")}
              className="file-input file-input-bordered w-full max-w-xs"
            />
            {errors.file && <p className="text-red-500">{errors.file.message}</p>}

            <button type="submit" className="btn btn-primary w-fit">
              送出
            </button>
          </form>
        </ModalBody>
      </Modal>
    </>
  )
}