import base64
from io import BytesIO
from PIL import Image



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
