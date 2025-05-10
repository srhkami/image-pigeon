import webview
import os.path
from handle_image import CustomImage, crop_img
from handle_doc import two_of_page, add_header
from response import Response
from handle_log import log


class Api:
  def save_docx(self, data):
    """
    儲存圖片成docx檔
    :param data:
    :return:
    """
    title = data.get('title')  # 文件標題
    files = data.get('images')  # 圖片清單
    min_size = data.get('min_size')  # 最小尺寸
    quality = data.get('quality')  # 壓縮率
    images = []  # python 圖片的清單
    log().info(f'【{title}】儲存Word開始執行')
    log().info(f'共有{len(files)}張圖，最小尺寸{min_size}，壓縮率{quality}')
    for file in files:
      image = CustomImage(file, min_size, quality)  # 逐一轉化成python自訂物件
      images.append(image)

    doc = two_of_page(images)
    doc = add_header(doc, title)

    path = webview.windows[0].create_file_dialog(
      webview.SAVE_DIALOG,
      save_filename=f'{title}.docx',
      file_types=('Word 文件 (*.docx)',)
    )
    log().debug(f'存檔位置：{path}')

    if not path:
      return Response(400, '已取消儲存').to_dict()
    try:
      doc.save(path)
      log().info('儲存成功，執行完畢')
      return Response(200, '儲存成功').to_dict()
    except PermissionError:
      log().exception('有相同檔名未關閉', exc_info=True)
      return Response(500, '請先關閉相同檔名之檔案').to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, str(e)).to_dict()

  def crop_image(self, file):
    """
    切割長截圖
    :param file
    :return:
    """
    try:
      image = CustomImage(file)
      images = crop_img(image)
      log().info('分割成功，執行完畢')
      return Response(200, message='新增成功', data=images).to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, message=str(e)).to_dict()


if __name__ == '__main__':
  debug_mode = False
  api = Api()
  url = os.path.join(os.getcwd(), './web/index.html') if not debug_mode else 'http://localhost:5173'
  window = webview.create_window(
    title='貼圖小鴿手',
    url=url,
    js_api=api,
    min_size=(800, 500)
  )
  webview.start(debug=debug_mode)
