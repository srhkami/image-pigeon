import {TVersionObject} from "@/utils/type.ts";

export const CHANGELOG_LIST: Array<TVersionObject> = [
  {
  version: '1.3.1',
  date: '1140709',
  logs: [
    {color: "new", text: '預覽圖片的說明欄位現在會自動儲存'},
  ]
},
  {
    version: '1.3',
    date: '1140531',
    logs: [
      {color: "new", text: '預覽圖片的說明欄位現在會自動儲存'},
      {color: "info", text: '調整預覽圖片的排版'},
      {color: "info", text: '輸出檔案的排版欄位不再預設選項'},
      {color: "info", text: '上傳圖片新增支援jfif、bmp檔'},
    ]
  },
  {
    version: '1.2.1',
    date: '1140518',
    logs: [
      {color: "fix", text: '修復遇到未知錯誤不會提示的問題'},
    ]
  },
  {
    version: '1.2',
    date: '1140516',
    logs: [
      {color: "new", text: '加入調整「說明文字對齊」、「字體大小」功能'},
      {color: "new", text: '加入「聯繫作者」對話框'},
    ]
  },
  {
    version: '1.1',
    date: '1140513',
    logs: [
      {color: "new", text: '加入「另存圖片」功能'},
      {color: "new", text: '加入「免責聲明」'},
      {color: "new", text: '加入「更新日誌」'},
      {color: "new", text: '現在處理過程中會顯示新的提示'},
    ]
  },
  {
    version: '1.0',
    date: '1140512',
    logs: [
      {color: "new", text: '加入「一頁兩張左右排版」'},
      {color: "new", text: '加入「主要功能介紹」'},
      {color: "fix", text: '修復圖片長寬可能超出表格的問題'},
    ]
  },
  {
    version: '0.9',
    date: '1140511',
    logs: [
      {color: "new", text: '加入「檢查更新」功能'},
      {color: "new", text: '加入「合併圖片」功能'},
      {color: "new", text: '發佈公開測試版'},
    ]
  },
  {
    version: '0.8',
    date: '1140510',
    logs: [
      {color: "new", text: '完成基礎功能，發佈內部測試版'},
    ]
  }
]

export const AppVersion = `${CHANGELOG_LIST[0].version}（${CHANGELOG_LIST[0].date}）`