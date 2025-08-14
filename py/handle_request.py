class OutputBaseData:
  """
  前端傳給後端的最終輸出資料（基礎類別）
  """

  def __init__(self, request):
    self.title = request.get('title', '照片黏貼表')  # 文件標題
    self.files = request.get('images', [])  # 檔案清單
    self.file_count = len(self.files)  # 檔案數量
    self.path = request.get('path')  # 儲存路徑


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
