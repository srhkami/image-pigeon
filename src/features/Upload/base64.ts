/**
 * 將檔案轉成base64
 * @param file 檔案
 */
export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  // 將 ArrayBuffer → base64（節省 dataURL 頭）
  let binary = ''
  const bytes = new Uint8Array(buf)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}