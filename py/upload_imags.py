import base64
from io import BytesIO
from PIL import Image
from handle_log import log


class UploadImage:
  """
  從前端傳來，完全未經處理的base64圖片檔案
  經過壓縮預處理過後，將回傳前端
  """

  def __init__(self, request):
    self.file = request.get('file')
    self.min_size = int(request.get('min_size', 1000))  # 最小尺寸
    self.quality = int(request.get('quality', "75"))  # 壓縮率

  def compress_image(self) -> dict:
    """
    將base64的資料轉換成PIL專用的物件，經壓縮處理後再轉換成給前端專用的base64字典
    :return:前端專用的base64字典
    """
    try:
      # 2）解析base64資料，使用PIL開啟圖片
      raw = base64.b64decode(self.file)
      pil_image = Image.open(BytesIO(raw))

      # 縮小圖片，如果小於設定尺寸，長寬都減至50%
      if self.quality != 100:
        width, height = pil_image.size
        if int(width) >= self.min_size * 2 or int(height) >= self.min_size * 2:
          pil_image = pil_image.resize((width // 2, height // 2))

        # 5) 移除不必要的 metadata（EXIF/ICC），減少大小
        if "exif" in pil_image.info:
          pil_image.info.pop("exif")
        if "icc_profile" in pil_image.info:
          pil_image.info.pop("icc_profile")

      # 4) 建立BytesIO格式
      out_buf = BytesIO()

      # 6) 輸出到記憶體
      pil_image.save(out_buf, format="WEBP", quality=self.quality, method=6)

      out_buf.seek(0)

      # 7) 重新編碼成 base64 + data URL
      new_b64 = base64.b64encode(out_buf.read()).decode("ascii")

      image_dict = {
        "base64": f"data:image/webp;base64,{new_b64}",
        "width": pil_image.width,
        "height": pil_image.height,
      }

      return image_dict
    except Exception as e:
      log().error(f'轉換圖片錯誤：{str(e)}', exc_info=True)
