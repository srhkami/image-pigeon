import webview
import json
from image import CustomImage, crop_img
from word import one_of_one
from response import Response


class Api:
  def save_docx(self, data):
    """
    儲存圖片成docx檔
    :param data:
    :return:
    """
    title = data.get('title')  # 文件標題
    files = data.get('images')  # 圖片清單
    images = []  # python 圖片的清單
    for file in files:
      image = CustomImage(file)  # 逐一轉化成python自訂物件
      images.append(image)
    try:
      one_of_one(title, images)
      return Response(200, '儲存成功').to_dict()
    except Exception as e:
      return Response(500, str(e)).to_dict()

  def crop_image(self, file):
    """
    切割長截圖
    :param file
    :return:
    """
    print(file)
    image = CustomImage(file)
    images = crop_img(image)
    return {'status': 200, 'data': images}


if __name__ == '__main__':
  api = Api()
  window = webview.create_window('貼圖小鴿手', 'http://localhost:5173', js_api=api)
  webview.start(debug=True)
