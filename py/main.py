import webview
import json
from image import CustomImage
from word import one_of_one


class Api:
  def send_images(self, data):
    title = data.get('title')  # 文件標題
    files = data.get('images')  # 圖片清單
    images = []  # python 圖片的清單
    for file in files:
      image = CustomImage(file)  # 逐一轉化成python自訂物件
      images.append(image)
    try:
      one_of_one(title, images)
      return {'status': 200, 'message': '儲存成功'}
    except Exception as e:
      return {'status': 500, 'message': str(e)}


if __name__ == '__main__':
  api = Api()
  window = webview.create_window('照片整理器', 'http://localhost:5173', js_api=api)
  webview.start(debug=True)
