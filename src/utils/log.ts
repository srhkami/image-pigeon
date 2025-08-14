import {TVersionObject} from "@/utils/type.ts";

export const CHANGELOG_LIST: Array<TVersionObject> = [
  {
    version: '1.4.2',
    date: '1140731',
    logs: [
      {color: "new", text: '上傳圖片新增將檔名作為備註的選項。'},
      {color: "info", text: '長截圖現在會裁剪上下各3%的重複區域，以避免文字被意外截斷。'},
    ]
  },
  {
    version: '1.4.1',
    date: '1140731',
    logs: [
      {color: "new", text: '在預覽圖片最下方加入「全部清除」按鈕'},
      {color: "new", text: '儲存功能加入進度條介面'},
      {color: "new", text: '首頁加入「作者的網站」'},
      {color: "info", text: '改善輸出檔案對話框，區分儲存圖片及Word功能'},
    ]
  },
  {
    version: '1.4.0',
    date: '1140712',
    logs: [
      {color: "new", text: '圖片預覽現在支援拖拽排序'},
      {color: "info", text: '調整圖片預覽按鈕樣式'},
      {color: "info", text: '更換檢查更新的網址'},
    ]
  },
  {
    version: '1.3.1',
    date: '1140709',
    logs: [
      {color: "fix", text: '修復圖片上下移動無法儲存對應備註的問題'},
      {color: "info", text: '調整部分文字、按鈕、輸入框大小'},
      {color: "info", text: '調整部分介面顏色'},
    ]
  },
  {
    version: '1.3.0',
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
    version: '1.2.0',
    date: '1140516',
    logs: [
      {color: "new", text: '加入調整「說明文字對齊」、「字體大小」功能'},
      {color: "new", text: '加入「聯繫作者」對話框'},
    ]
  },
  {
    version: '1.1.0',
    date: '1140513',
    logs: [
      {color: "new", text: '加入「另存圖片」功能'},
      {color: "new", text: '加入「免責聲明」'},
      {color: "new", text: '加入「更新日誌」'},
      {color: "new", text: '現在處理過程中會顯示新的提示'},
    ]
  },
  {
    version: '1.0.0',
    date: '1140512',
    logs: [
      {color: "new", text: '加入「一頁兩張左右排版」'},
      {color: "new", text: '加入「主要功能介紹」'},
      {color: "fix", text: '修復圖片長寬可能超出表格的問題'},
    ]
  },
  {
    version: '0.9.0',
    date: '1140511',
    logs: [
      {color: "new", text: '加入「檢查更新」功能'},
      {color: "new", text: '加入「合併圖片」功能'},
      {color: "new", text: '發佈公開測試版'},
    ]
  }
]

export const AppVersion = `${CHANGELOG_LIST[0].version}（${CHANGELOG_LIST[0].date}）`