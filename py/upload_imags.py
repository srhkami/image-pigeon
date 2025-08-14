import base64
from io import BytesIO
from PIL import Image
from handle_log import log
import math
import webview


class UploadImages:
  """
  從前端傳來，完全未經處理的圖片列表
  經過壓縮預處理過後，將回傳前端
  """

  def __init__(self, request):
    self.files = request.get('files')
    self.min_size = int(request.get('min_size', 1000))  # 最小尺寸
    self.quality = int(request.get('quality', 80))  # 壓縮率

  def to_base64_images(self) -> list[dict]:
    """
    把所有圖片轉換成壓縮後的自訂圖片物件清單，並轉換為base64檔
    :return: base64檔案清單
    """
    images = []  # python 圖片的清單
    for index, file in enumerate(self.files):
      base64_dict = self.compress_image(file.get('base64'), self.min_size, self.quality)
      images.append(base64_dict)
      log().info(f'轉換圖片：{index + 1}/{len(self.files)}')
      webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({index})")
    return images

  def compress_image(self, base64_str: str, min_size: int, quality: int) -> dict:
    """
    將base64的資料轉換成PIL專用的物件，經壓縮處理後再轉換成給前端專用的base64字典
    :param base64_str:
    :param min_size:
    :param quality:
    :return:
    """
    print(base64_str)
    try:
      # 1）解析 data URL ，去掉 "data:image/xxx;base64,"
      if "," in base64_str:
        header, encoded = base64_str.split(",", 1)
      else:
        header, encoded = "", base64_str

      # 2）解析base64資料，使用PIL開啟圖片
      raw = base64.b64decode(encoded)
      pil_image = Image.open(BytesIO(raw))
      # 縮小圖片，如果小於設定尺寸，長寬都減至50%
      if quality != 100:
        width, height = pil_image.size
        if int(width) >= min_size * 2 or int(height) >= min_size * 2:
          pil_image = pil_image.resize((width // 2, height // 2))

        # 5) 移除不必要的 metadata（EXIF/ICC），減少大小
        if "exif" in pil_image.info:
          pil_image.info.pop("exif")
        if "icc_profile" in pil_image.info:
          pil_image.info.pop("icc_profile")

      # 4) 建立BytesIO格式
      out_buf = BytesIO()

      # 6) 輸出到記憶體
      if quality == 100:
        pil_image.save(out_buf, format="WEBP")
      else:
        pil_image.save(out_buf, format="WEBP", quality=quality, method=6)

      out_buf.seek(0)

      # 7) 重新編碼成 base64 + data URL
      new_b64 = base64.b64encode(out_buf.read()).decode("ascii")

      return {
        "base64": f"data:image/webp;base64,{new_b64}",
        "width": pil_image.width,
        "height": pil_image.height,
      }
    except Exception as e:
      log().error(f'轉換圖片錯誤：{str(e)}', exc_info=True)
