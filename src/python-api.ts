/* 這裡整理了所有python的AP */

export const send_text = async (text: string) => {
  return window.pywebview.api.send_text(text)
}
