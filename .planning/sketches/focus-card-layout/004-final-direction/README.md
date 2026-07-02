## Variant: final-direction

### Design stance
最終方向互動 prototype：一般編輯採 center-stage 焦點卡片；排序模式完全獨立成小圖拖曳清單；右側用同一套嚴格保序 auto layout 顯示 Word 預覽。

### Key choices
- 編輯 / 排序模式切換。
- 編輯模式支援滾輪與鍵盤切換焦點、備註編輯、大/小直圖切換。
- 排序模式只提供小圖拖曳排序。
- 右側預覽追蹤 active item 所在頁，並顯示頁面縮圖。

### Trade-offs
- 這是 disposable HTML prototype，不是 production React code。
- 圖片用 CSS gradient 假圖，重點是互動與資訊架構。
