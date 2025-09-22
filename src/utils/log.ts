import {TVersionObject} from "@/utils/type.ts";

export const CHANGELOG_LIST: Array<TVersionObject> = [
  {
    version: '1.6.2',
    date: '1140922',
    logs: [
      {color: "new", text: '長截圖支援多檔上傳。'},
    ]
  },
  {
    version: '1.6.1',
    date: '1140915',
    logs: [
      {color: "fix", text: '修復導入長截圖無法帶入預設備註的問題。'},
      {color: "fix", text: '修復備註空白時導致圖片無法正常匯出Word檔的問題。'},
    ]
  },
  {
    version: '1.6.0',
    date: '1140828',
    logs: [
      {color: "new", text: '新增「排序模式」，提高拖曳排序圖片的易用性。'},
      {color: "info", text: '調整底端欄佈局。'},
      {color: "info", text: '大幅提高導入圖片時的速度。'},
      {color: "fix", text: '修復圖片過大時無法正確導入的問題。'},
    ]
  },
  {
    version: '1.5.1',
    date: '1140821',
    logs: [
      {color: "fix", text: '修正合併圖片輸出Word會變成空白的問題。'},
    ]
  },
  {
    version: '1.5.0',
    date: '1140818',
    logs: [
      {color: "new", text: '新增讀取及儲存專用檔案的功能。'},
      {color: "new", text: '導入圖片新增「使用檔名作為備註」的選項。'},
      {color: "new", text: '另存圖片新增「使用備註作為檔名」的選項。'},
      {color: "info", text: '壓縮圖片的功能移至導入圖片時處理。'},
      {color: "info", text: '長截圖分割現在會預留上下空間，以避免文字被意外裁切。'},
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