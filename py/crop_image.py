import base64
from io import BytesIO
from PIL import Image
from handle_log import log
import math
import webview


class LongScreenImage:
  """
  自訂的圖片類型
  """

  def __init__(self, file):
    self.stream = self.base64_to_BytesIO(file.get('base64'))  # 文件流

  def base64_to_BytesIO(self, base64_str: str, ) -> BytesIO:
    """
    將base64圖片轉化成BytesIO
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

      # 3) 建立BytesIO格式
      out_buf = BytesIO()

      # 6) 輸出到記憶體
      pil_image.save(out_buf, format="WEBP")
      out_buf.seek(0)

      return out_buf

    except Exception as e:
      log().error(f'處理圖片錯誤：{str(e)}', exc_info=True)


def crop_to_images(image: LongScreenImage):
  """
  切割圖片，並返回base64的圖片列表
  如果返回空，則代表圖片不符合長截圖要件
  :param image: 自訂的圖片物件
  :return: base64的圖片列表
  """
  log().info('開始分割圖片')
  try:
    img = Image.open(image.stream)  # 使用文件流打開圖片
    w = img.width
    h = img.height
    log().debug(f'圖片尺寸為{img.size}')
    if w / h <= 9 / 21:
      # 如果圖片寬高比小於手機螢幕尺寸，判斷是長截圖
      nh = w * 2  # 以寬為基礎，每2倍的寬分割一次，
      reserve_h = nh * 0.03  # 預留的上下空間，以避免文字被意外裁切
      blocks = math.ceil(h / nh)  # 應分割區塊數
      log().info(f'分割數：{blocks}')
      return_images = []
      for i in range(0, blocks):
        if i == 0:
          cropped = img.crop((0, i * nh, w, (i + 1) * nh + (reserve_h * 2)))  # (原點x, 原點y, 終點x, 終點-y)
        else:
          cropped = img.crop((0, i * nh - reserve_h, w, (i + 1) * nh + reserve_h))  # (原點x, 原點y, 終點x, 終點-y)
        return_images.append(pil_image_to_base64(cropped))
      return return_images
    else:
      return []
  except Exception as e:
    log().error(f'分割圖片錯誤：{str(e)}', exc_info=True)
    raise


def pil_image_to_base64(img: Image.Image) -> dict:
  """
  將Pillow的圖片物件轉化為要傳回前端的字典
  包含：base64資料、寬、高
  :param img:
  :return:
  """
  buffer = BytesIO()
  img.save(buffer, format="JPEG")
  base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
  return {
    "base64": f"data:image/png;base64,{base64_str}",
    "width": img.width,
    "height": img.height,
  }