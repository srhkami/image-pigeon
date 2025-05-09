import webview
import os.path
from handle_image import CustomImage, crop_img
from handle_doc import two_of_page, add_header
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
    doc = two_of_page(images)
    doc = add_header(doc, title)

    path = webview.windows[0].create_file_dialog(
      webview.SAVE_DIALOG,
      save_filename=f'{title}.docx',
      file_types=('Word 文件 (*.docx)',)
    )

    if not path:
      return Response(400, '已取消儲存').to_dict()
    try:
      doc.save(path)
      return Response(200, '儲存成功').to_dict()
    except PermissionError:
      return Response(500, '請先關閉相同檔名之檔案').to_dict()
    except Exception as e:
      return Response(500, str(e)).to_dict()

  def crop_image(self, file):
    """
    切割長截圖
    :param file
    :return:
    """
    image = CustomImage(file)
    images = crop_img(image)
    return {'status': 200, 'data': images}


if __name__ == '__main__':
  debug_mode = True
  api = Api()
  url = os.path.join(os.getcwd(), './web/index.html') if not debug_mode else 'http://localhost:5173'
  window = webview.create_window('貼圖小鴿手', url, js_api=api)
  webview.start(debug=debug_mode)
