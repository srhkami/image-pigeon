import webview
import os.path
from handle_image import CustomImage, crop_img
from handle_doc import creat_docx, add_header
from response import Response
from handle_log import log

DEBUG_MODE = True

class Api:
  def save_docx(self, data):
    """
    儲存圖片成docx檔
    :param data:
    :return:
    """
    title = data.get('title')  # 文件標題
    files = data.get('images')  # 圖片清單
    min_size = int(data.get('min_size'))  # 最小尺寸
    quality = int(data.get('quality'))  # 壓縮率
    mode = int(data.get('mode'))  # 模式
    images = []  # python 圖片的清單
    log().info(f'【{title}】儲存Word開始執行')
    log().info(f'共有{len(files)}張圖，最小尺寸{min_size}，壓縮率{quality}')
    for file in files:
      image = CustomImage(file, min_size, quality)  # 逐一轉化成python自訂物件
      images.append(image)

    doc = creat_docx(images, mode)
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
      if not len(images):
        log().error('此圖片非屬於長截圖')
        return Response(400, message='此圖片非屬於長截圖').to_dict()
      log().info('分割成功，執行完畢')
      return Response(200, message='新增成功', data=images).to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, message=str(e)).to_dict()

if __name__ == '__main__':
  if DEBUG_MODE:
    log().error('注意！！DEBUG模式已開啟！！')
  log().info('請耐心等待程式開啟......')
  api = Api()
  url = os.path.join(os.getcwd(), './web/index.html') if not DEBUG_MODE else 'http://localhost:5173'
  window = webview.create_window(
    title='貼圖小鴿手',
    url=url,
    js_api=api,
    min_size=(800, 500),
    maximized=True,
  )
  log().debug('程式開啟成功')
  webview.start(debug=DEBUG_MODE)
