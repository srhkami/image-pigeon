import json
import webview
import os.path
from save_docx import creat_docx, add_header, OutputWord
from handle_request import OutputBaseData, Response
from handle_log import log
from pprint import pprint
from upload_imags import UploadImages
from crop_image import LongScreenImage, crop_to_images
from save_images import SaveAsImages, save

DEBUG_MODE = False


class Api:

  def upload_image(self, request):
    """
    將單張的上傳圖片壓縮後再傳回前端
    :param request:
    :return:
    """
    data = UploadImages(request)
    base64_images = data.to_base64_images()
    return Response(status=200, data=base64_images).to_dict()

  def crop_image(self, file):
    """
    切割長截圖
    :param file
    :return:
    """
    try:
      image = LongScreenImage(file)
      images = crop_to_images(image)
      if not len(images):
        log().error('此圖片不是長截圖')
        return Response(400, '此圖片不是長截圖').to_dict()
      log().info('分割成功，執行完畢')
      return Response(200, '新增成功', images).to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, '處理失敗，請回報作者').to_dict()

  def save_docx(self, request):
    """
    儲存圖片成docx檔
    :param request: 情求的資料
    :return:
    """
    data = OutputWord(request)
    log().info(f'【{data.title}】儲存Word開始執行')
    log().info(json.dumps(data.to_dict(), ensure_ascii=False))

    doc = creat_docx(data)
    doc = add_header(doc, data.title)

    try:
      doc.save(data.path)
      log().info('儲存成功，執行完畢')
      return Response(200, '儲存成功').to_dict()
    except PermissionError:
      log().exception('有相同檔名未關閉', exc_info=True)
      return Response(500, '請先關閉相同檔名之檔案').to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, '處理失敗，請回報作者').to_dict()

  def save_images(self, request):
    """
    直接儲存壓縮後的圖片
    :param request:
    :return:
    """
    data = SaveAsImages(request)
    log().info(f'【{data.title}】開始壓縮圖片')
    log().info(json.dumps(data.to_dict(), ensure_ascii=False))
    try:
      save(data)
      return Response(200, '儲存成功').to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, '處理失敗，請回報作者').to_dict()

  def save_json(self, request):
    """
    儲存JSON檔
    :param request: 來自前端的圖片物件
    :return:
    """
    data = OutputBaseData(request)
    log().info(f'【{data.title}】開始儲存JSON')
    new_files = []
    for file in data.files:
      new_files.append({
        'base64': file.get('base64'),
        'remark': file.get('remark'),
        'width': file.get('width'),
        'height': file.get('height'),
        'rotation': file.get('rotation'),
      })
    try:
      with open(data.path, 'w', encoding="utf-8") as file:
        json.dump({'images': new_files}, file, ensure_ascii=False)
      return Response(200, '儲存成功').to_dict()
    except Exception as e:
      log().exception(str(e), exc_info=True)
      return Response(500, str(e)).to_dict()

  def select_path(self, data):
    """
    選擇路徑
    :param data:
    :return:
    """
    mode = data.get('mode')
    title = data.get('title', '照片黏貼表')
    if not mode:
      return Response(400, message='參數錯誤').to_dict()
    if mode == 'word':
      path = webview.windows[0].create_file_dialog(
        webview.SAVE_DIALOG,
        save_filename=f'{title}.docx',
        file_types=('WORD 文件 (*.docx)',)
      )
    elif mode == 'json':
      path = webview.windows[0].create_file_dialog(
        webview.SAVE_DIALOG,
        save_filename=f'{title}.json',
        file_types=('JSON 文件 (*.json)',)
      )
    else:
      folder = webview.windows[0].create_file_dialog(
        webview.FOLDER_DIALOG,
        allow_multiple=False
      )
      path = folder[0] if folder else None

    if not path:
      error_text = '已取消儲存'
      log().error(error_text)
      return Response(400, error_text).to_dict()
    log().info(f'選擇存檔位置：{path}')
    return Response(200, path).to_dict()


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
