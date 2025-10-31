import base64
from io import BytesIO
from PIL import Image
from handle_log import log
import webview
from handle_request import OutputBaseData
import os


class SaveImage:
  """
  用來儲存的圖片物件，同時作為輸出Word圖片使用
  """

  def __init__(self, image):
    self.name = image.get('name')
    self.remark = image.get('remark')  # 圖片說明
    self.rotation = image.get('rotation') * -1  # 旋轉角度，前端傳入及Pillow的角度相反
    self.stream = self.base64_to_BytesIO(image.get('base64'))  # 文件流

  def base64_to_BytesIO(self, base64_str: str) -> BytesIO:
    """
    將base64圖片轉化成BytesIO，並壓縮
    :param base64_str: base64的字串
    :return: BytesIO
    """
    try:
      # 1）解析 data URL ，去掉 "data:image/xxx;base64,"
      if "," in base64_str:
        header, encoded = base64_str.split(",", 1)
      else:
        header, encoded = "", base64_str

      # 2）解析base64資料，使用PIL開啟圖片
      raw = base64.b64decode(encoded)
      pil_image = Image.open(BytesIO(raw))

      # 3）旋轉圖片（正角度為逆時針）
      pil_image = pil_image.rotate(self.rotation, expand=True)

      # 4) 建立BytesIO格式
      out_buf = BytesIO()

      # 5) 輸出到記憶體
      pil_image.save(out_buf, format="PNG")
      out_buf.seek(0)

      return out_buf

    except Exception as e:
      log().error(f'處理圖片錯誤：{str(e)}', exc_info=True)
      # 關鍵：將異常重新拋出，防止 self.stream 變成 None
      raise


class SaveAsImages(OutputBaseData):
  """
  另存成圖片的資料
  """

  def __init__(self, request):
    super().__init__(request)
    self.is_remark_mode = request.get('is_remark_mode')

  def to_compressed_image(self, index: int) -> SaveImage:
    """
    把單一圖片轉換成壓縮後的自訂圖片物件
    :param index:
    :return:
    """
    image = SaveImage(self.files[index])  # 逐一轉化成python自訂物件
    log().info(f'處理圖片：{index + 1}/{self.file_count} 完成')
    return image

  def to_dict(self):
    return {
      '標題': self.title,
      '檔案數': self.file_count,
    }


def save(data: SaveAsImages):
  for i in range(data.file_count):
    image = data.to_compressed_image(i)
    img = Image.open(image.stream)
    remark = image.remark.replace('\n', '_')
    filename = f'{remark}.jpg' if data.is_remark_mode else f'{data.title}_{i + 1}.jpg'
    save_path = os.path.join(data.path, filename)
    img.save(save_path)
    log().info(f'{filename} 儲存成功')
    # 主動呼叫前端增加數量
    webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({i})")
