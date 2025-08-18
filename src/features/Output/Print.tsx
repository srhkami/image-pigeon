// import {useState} from "react";
// import {useForm} from "react-hook-form";
// import {CustomImage} from "@/utils/type.ts";
// import {Alert, Button, Col, FormInputCol, Row} from "@/component";
// import {IoMdAlert} from "react-icons/io";
// import {AlertLoading} from "@/layout";
// import {FaRegFileWord} from "react-icons/fa6";
//
// type Props = {
//   readonly images: CustomImage[],
// }
//
// export default function Print({images}: Props){
//
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//
//   const {
//     register,
//     handleSubmit,
//     formState: {errors}
//   } = useForm<TOutputData>({defaultValues: {title: '照片黏貼表', min_size: 1000}});
//
//   return (
//     <Row>
//       <Col xs={12}>
//         <Alert color='info'>
//           <IoMdAlert className='text-lg'/>
//           此功能可儲存WORD文件，便於使用者自行保存、編輯；本功能不會壓縮圖片，請自行使用WORD內建壓縮功能節省空間。
//         </Alert>
//       </Col>
//       <FormInputCol xs={12} label='文件標題 / 檔案名稱' error={errors.title?.message}>
//         <input type='text' className="input w-full"
//                {...register('title', {required: "此填寫此欄位"})}/>
//       </FormInputCol>
//       {/*<FormInputCol xs={6} label='說明文字對齊' error={errors.align_vertical?.message}>*/}
//       {/*  <select className="select w-full" id='align_vertical'*/}
//       {/*          defaultValue='center' {...register('align_vertical')}>*/}
//       {/*    <option value='top'>垂直置頂</option>*/}
//       {/*    <option value='center'>垂直置中</option>*/}
//       {/*  </select>*/}
//       {/*</FormInputCol>*/}
//       {/*<FormInputCol xs={6} label='字體大小' error={errors.font_size?.message}>*/}
//       {/*  <select className="select w-full" id='font_size' defaultValue='12'*/}
//       {/*          {...register('font_size')}>*/}
//       {/*    <option value='10'>小（10）</option>*/}
//       {/*    <option value='11'>偏小（11）</option>*/}
//       {/*    <option value='12'>普通（12）</option>*/}
//       {/*    <option value='13'>偏大（13）</option>*/}
//       {/*    <option value='14'>大（14）</option>*/}
//       {/*  </select>*/}
//       {/*</FormInputCol>*/}
//       <FormInputCol xs={12} label='排版' error={errors.mode?.message}>
//         <select className="select w-full"
//                 {...register('mode', {required: '請選擇此欄位'})}>
//           <option value=''>請選擇</option>
//           <option value='1'>一頁 2 張（上下排佈，適用橫式圖片）</option>
//           <option value='2'>一頁 2 張（左右排佈，適用直式圖片）</option>
//           <option value='6'>一頁 6 張（適用直式圖片)</option>
//         </select>
//       </FormInputCol>
//       <Col xs={12} className='mt-6'>
//         {isLoading ?
//           <AlertLoading count={images.length}/>
//           :
//           <Button color='success' shape='block'>
//             <FaRegFileWord/>
//             預覽列印
//           </Button>
//         }
//       </Col>
//     </Row>
//   )
// }