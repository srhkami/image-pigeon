from handle_image import CustomImage


class OutputData:
  """
  輸出時傳來的資料
  """

  def __init__(self, data):
    self.title = data.get('title', '照片黏貼表')  # 文件標題
    self.files = data.get('images', [])  # 檔案清單
    self.file_count = len(self.files)  # 檔案數量
    self.min_size = int(data.get('min_size', 1000))  # 最小尺寸
    self.quality = int(data.get('quality', 80))  # 壓縮率
    self.mode = int(data.get('mode', 1))  # 模式
    self.align_vertical = data.get('align_vertical')  # 垂直對齊
    self.font_size = int(data.get('font_size'))  # 字體大小
    self.path = data.get('path')  # 儲存路徑

  def to_images(self):
    """
    :return: 轉換成自訂python圖片的清單
    """
    images = []  # python 圖片的清單
    for file in self.files:
      image = CustomImage(file, self.min_size, self.quality)  # 逐一轉化成python自訂物件
      images.append(image)
    return images

  def to_dict(self):
    return {
      '標題': self.title,
      '檔案數': self.file_count,
      '最小尺寸': self.min_size,
      '壓縮率': self.quality,
      '模式': self.mode,
    }


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
