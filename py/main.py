import json
from PIL import Image
import webview
import os.path
from handle_image import CustomImage, crop_img
from handle_doc import creat_docx, add_header
from handle_request import OutputData, Response
from handle_log import log


DEBUG_MODE = False


class Api:
  def save_docx(self, request):
    """
    儲存圖片成docx檔
    :param request: 情求的資料
    :return:
    """
    data = OutputData(request)
    log().info(f'【{data.title}】儲存Word開始執行')
    log().info(json.dumps(data.to_dict(), ensure_ascii=False))

    doc = creat_docx(data)
    doc = add_header(doc, data.title)

    path = webview.windows[0].create_file_dialog(
      webview.SAVE_DIALOG,
      save_filename=f'{data.title}.docx',
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

  def save_images(self, request):
    """
    直接儲存壓縮後的圖片
    :param request:
    :return:
    """
    data = OutputData(request)
    log().info(f'【{data.title}】壓縮圖片')
    log().info(json.dumps(data.to_dict(), ensure_ascii=False))

    folder = webview.windows[0].create_file_dialog(
      webview.FOLDER_DIALOG,
      allow_multiple=False
    )
    log().debug(f'存檔位置：{folder[0]}')

    if not folder:
      return Response(400, '已取消儲存').to_dict()
    for index, image in enumerate(data.to_images()):
      img = Image.open(image.stream)
      filename = f'{data.title}_{index + 1}.jpg'
      save_path = os.path.join(folder[0], filename)
      img.save(save_path)
    return Response(200, '儲存成功').to_dict()


if __name__ == '__main__':
  if DEBUG_MODE:
    log().error('注意！！DEBUG模式已開啟！！')
  log().info('請耐心等待程式開啟......')
  api = Api()
  url = os.path.join(os.getcwd(), './html/index.html') if not DEBUG_MODE else 'http://localhost:5173'
  window = webview.create_window(
    title='貼圖小鴿手',
    url=url,
    js_api=api,
    min_size=(800, 500),
    maximized=True,
  )
  log().debug('程式開啟成功')
  webview.start(debug=DEBUG_MODE)
