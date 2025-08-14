from handle_image import CustomImage, pil_image_to_base64
from PIL import Image
from handle_log import log
import webview


class UploadImages:
  def __init__(self, request):
    self.files = request.get('files')
    self.min_size = int(request.get('min_size', 1000))  # 最小尺寸
    self.quality = int(request.get('quality', 80))  # 壓縮率

  def to_base64_image(self) -> list[dict]:
    """
    把所有圖片轉換成壓縮後的自訂圖片物件清單，並轉換為base64檔
    :return: base64檔案清單
    """
    images = []  # python 圖片的清單
    for index, file in enumerate(self.files):
      image = CustomImage(file, self.min_size, self.quality)  # 逐一轉化成python自訂物件
      pil_image = Image.open(image.stream)  # 使用文件流打開圖片
      base64_image = pil_image_to_base64(pil_image)  # 轉換為傳回前端的base64檔案
      log().info(f'轉換圖片：{index + 1}/{len(self.files)}')
      webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({index})")
      images.append(base64_image)
    return images


class OutputData:
  """
  前端傳給後端的最終輸出資料（基礎類別）
  """

  def __init__(self, data):
    self.title = data.get('title', '照片黏貼表')  # 文件標題
    self.files = data.get('images', [])  # 檔案清單
    self.file_count = len(self.files)  # 檔案數量
    self.path = data.get('path')  # 儲存路徑


class OutputWord(OutputData):
  """
  輸出成word的資料
  """

  def __init__(self, data):
    super().__init__(data)
    self.mode = int(data.get('mode', 1))  # 模式
    self.align_vertical = data.get('align_vertical')  # 垂直對齊
    self.font_size = int(data.get('font_size'))  # 字體大小

  def to_compressed_images(self) -> list[CustomImage]:
    """
    把所有圖片轉換成壓縮後的自訂圖片物件清單
    :return: 轉換成自訂python圖片的清單，並於過程中壓縮
    """
    images = []  # python 圖片的清單
    for index, file in enumerate(self.files):
      image = CustomImage(file, self.min_size, self.quality)  # 逐一轉化成python自訂物件
      log().info(f'轉換圖片：{index + 1}/{self.file_count}')
      webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({index})")
      images.append(image)
    return images

  def to_dict(self):
    return {
      '標題': self.title,
      '檔案數': self.file_count,
      '模式': self.mode,
    }


class OutputImages(OutputData):
  """
  另存成圖片的資料
  """

  def __init__(self, data):
    super().__init__(data)
    self.min_size = int(data.get('min_size', 1000))  # 最小尺寸
    self.quality = int(data.get('quality', 80))  # 壓縮率

  def to_compressed_images(self) -> list[CustomImage]:
    """
    把所有圖片轉換成壓縮後的自訂圖片物件清單
    :return: 轉換成自訂python圖片的清單，並於過程中壓縮
    """
    images = []  # python 圖片的清單
    for index, file in enumerate(self.files):
      image = CustomImage(file, self.min_size, self.quality)  # 逐一轉化成python自訂物件
      log().info(f'轉換圖片：{index + 1}/{self.file_count}')
      webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({index})")
      images.append(image)
    return images

  def to_compressed_image(self, index: int) -> CustomImage:
    """
    把單一圖片轉換成壓縮後的自訂圖片物件
    :param index:
    :return: 轉換成自訂python中自訂的圖片類型，並於過程中壓縮
    """
    image = CustomImage(self.files[index], self.min_size, self.quality)  # 逐一轉化成python自訂物件
    log().info(f'轉換圖片：{index + 1}/{self.file_count} 完成')
    return image

  def to_dict(self):
    return {
      '標題': self.title,
      '檔案數': self.file_count,
      '最小尺寸': self.min_size,
      '壓縮率': self.quality,
      '模式': self.mode,
    }


# class OutputData:
#   """
#   輸出時傳來的資料
#   """
#
#   def __init__(self, data):
#     self.title = data.get('title', '照片黏貼表')  # 文件標題
#     self.files = data.get('images', [])  # 檔案清單
#     self.file_count = len(self.files)  # 檔案數量
#     self.min_size = int(data.get('min_size', 1000))  # 最小尺寸
#     self.quality = int(data.get('quality', 80))  # 壓縮率
#     self.mode = int(data.get('mode', 1))  # 模式
#     self.align_vertical = data.get('align_vertical')  # 垂直對齊
#     self.font_size = int(data.get('font_size'))  # 字體大小
#     self.path = data.get('path')  # 儲存路徑
#
#   def to_compressed_images(self) -> list[CustomImage]:
#     """
#     把所有圖片轉換成壓縮後的自訂圖片物件清單
#     :return: 轉換成自訂python圖片的清單，並於過程中壓縮
#     """
#     images = []  # python 圖片的清單
#     for index, file in enumerate(self.files):
#       image = CustomImage(file, self.min_size, self.quality)  # 逐一轉化成python自訂物件
#       log().info(f'轉換圖片：{index + 1}/{self.file_count}')
#       webview.windows[0].evaluate_js(f"window.pywebview.updateProgress({index})")
#       images.append(image)
#     return images
#
#   def to_compressed_image(self, index: int) -> CustomImage:
#     """
#     把單一圖片轉換成壓縮後的自訂圖片物件
#     :param index:
#     :return: 轉換成自訂python中自訂的圖片類型，並於過程中壓縮
#     """
#     image = CustomImage(self.files[index], self.min_size, self.quality)  # 逐一轉化成python自訂物件
#     log().info(f'轉換圖片：{index + 1}/{self.file_count} 完成')
#     return image
#
#   def to_dict(self):
#     return {
#       '標題': self.title,
#       '檔案數': self.file_count,
#       '最小尺寸': self.min_size,
#       '壓縮率': self.quality,
#       '模式': self.mode,
#     }


class Response:
  """
  自訂的回應類別
  """

  def __init__(self, status, message='', data=None):
    self.status = status
    self.message = message
    self.data = data

  def to_dict(self):
    return {
      'status': self.status,
      'message': self.message,
      'data': self.data,
    }
