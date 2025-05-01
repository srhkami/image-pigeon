import {useState} from "react";
import {SubmitHandler, useForm} from "react-hook-form";
import {send_text} from "../python-api.ts";

function App() {

  const [title, setTitle] = useState('');
  const [layout, setLayout] = useState('1x1');

  // const handleSubmit = () => {
  //   const data = {
  //     title: title,
  //     layout: layout
  //   };
  //
  //   // 呼叫 Python 的 API
  //   window.pywebview.api.save_data(data)
  //     .then(response => {
  //       console.log("伺服器回應：", response);
  //       alert("資料已送出！");
  //     });
  // };

  const {register, handleSubmit} = useForm<TFormData>();

  type TFormData = {
    text: string
  }

  const onSubmit: SubmitHandler<TFormData> = (formData) => {
    const text = formData.text;
    send_text(text).then(res => console.log(res));
  }

  return (
    <div className="container">
      <h1>貼圖鴿手</h1>

      <div>
        <label>預設標題：</label><br/>
        <input type="text" placeholder="請輸入檔案的標題" className="input"
               value={title} onChange={e => setTitle(e.target.value)}/>
      </div>

      <div style={{marginTop: '20px'}}>
        <label>選擇排版模式：</label><br/>
        <select value={layout} onChange={e => setLayout(e.target.value)}>
          <option value="1x1">一頁1張</option>
          <option value="2x2">一頁4張 (2x2)</option>
          <option value="3x3">一頁9張 (3x3)</option>
        </select>
      </div>

      <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
        <legend className="fieldset-legend">Login options</legend>
        <label className="label">
          <input type="checkbox" defaultChecked className="checkbox"/>
          Remember me
        </label>
      </fieldset>

      <button style={{marginTop: '30px'}}>送出設定</button>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="text" placeholder="請輸入文字" className="input" {...register('text')}/>
        <button className="btn btn-outline">Default</button>
      </form>
    </div>
  );
}

export default App
