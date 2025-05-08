import base64
from io import BytesIO
from PIL import Image
from log import log
import math


class CustomImage:
  """
  自訂的圖片類型
  """

  def __init__(self, image):
    self.name = image.get('name')
    self.remark = image.get('remark')  # 圖片說明
    self.rotation = image.get('rotation') * -1  # 旋轉角度，前端傳入及Pillow的角度相反
    self.stream = base64_to_image(image.get('base64'), self.rotation)  # 文件流


def base64_to_image(base64_str: str, rotation) -> BytesIO:
  """
  將base64圖片轉化成BytesIO
  :param base64_str:
  :return: BytesIO
  """
  __, encoded = base64_str.split(",", 1)  # 去掉 "data:image/xxx;base64,"
  img_data = base64.b64decode(encoded)
  # 使用PIL開啟圖片
  img = Image.open(BytesIO(img_data))
  # 🔄 旋轉圖片（正角度為逆時針）
  rotated = img.rotate(rotation, expand=True)
  # 存成 BytesIO 給 docx 用
  output = BytesIO()
  rotated.save(output, format="PNG")
  output.seek(0)
  return output


def crop_img(image: CustomImage):
  """
  切割圖片，並返回base64的圖片列表
  如果返回空，則代表圖片不符合長截圖要件
  :param image: 自訂的圖片物件
  :return: base64的圖片列表
  """
  img = Image.open(image.stream)  # 使用文件流打開圖片
  w = img.width
  h = img.height
  if w / h <= 9 / 21:
    log().debug(f'圖片尺寸為{img.size}')
    # 如果圖片寬高比小於手機螢幕尺寸，判斷是長截圖
    nh = w * 2  # 以寬為基礎，每2倍的寬分割一次，
    blocks = math.ceil(h / nh)  # 應分割區塊數
    return_images = []
    for i in range(0, blocks):
      cropped = img.crop((0, i * nh, w, (i + 1) * nh))  # (原點x, 原點y, 終點x, 終點-y)
      return_images.append(pil_image_to_base64(cropped))
    return return_images
  else:
    return []


def pil_image_to_base64(img: Image.Image) -> dict:
  buffer = BytesIO()
  img.save(buffer, format="JPEG")
  base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
  return {
    "base64": f"data:image/png;base64,{base64_str}",
    "width": img.width,
    "height": img.height,
  }
