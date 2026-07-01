import json
import sys
import webview
import os.path
import threading
import subprocess
from app.api import create_app
from save_docx import creat_docx, add_header, OutputWord
from handle_request import OutputBaseData, Response
from handle_log import log
from upload_imags import UploadImage
from crop_image import LongScreenImage, crop_to_images
from save_images import SaveAsImages, save

DEBUG_MODE = os.environ.get('IMAGE_PIGEON_DEBUG') == '1'
FASTAPI_HOST = '127.0.0.1'
FASTAPI_PORT = 18765
VITE_DEV_URL = 'http://localhost:5175'


def get_root_path():
    # 如果是打包後的 exe
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    # 如果是開發環境的 .py
    else:
        return os.path.dirname(os.path.abspath(__file__))


def get_project_root_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_static_dir():
    project_root = get_project_root_path()
    dist_dir = os.path.join(project_root, 'dist')
    if os.path.exists(os.path.join(dist_dir, 'index.html')):
        return dist_dir
    return os.path.join(project_root, 'html')


def get_frontend_url():
    if DEBUG_MODE:
        return VITE_DEV_URL
    return f'http://{FASTAPI_HOST}:{FASTAPI_PORT}'


def start_fastapi_server():
    import uvicorn

    app = create_app(static_dir=get_static_dir())
    config = uvicorn.Config(
        app,
        host=FASTAPI_HOST,
        port=FASTAPI_PORT,
        log_level='warning',
        access_log=False,
    )
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True, name='fastapi-server')
    thread.start()
    return thread


def build_project_save_path(parent_path: str, title: str = '照片黏貼表') -> str:
    safe_title = str(title or '照片黏貼表').strip() or '照片黏貼表'
    for separator in {os.sep, os.altsep, '/', '\\'}:
        if separator:
            safe_title = safe_title.replace(separator, '_')
    if not safe_title.endswith('.ipigeon'):
        safe_title = f'{safe_title}.ipigeon'
    return os.path.join(parent_path, safe_title)


def normalize_dialog_path(selected_path):
    if not selected_path:
        return None
    if isinstance(selected_path, str):
        return selected_path
    return selected_path[0] if len(selected_path) else None


def open_file(path: str) -> None:
    startfile = getattr(os, 'startfile', None)
    if startfile:
        startfile(path)
        return
    if sys.platform == 'darwin':
        subprocess.Popen(['open', path])
        return
    subprocess.Popen(['xdg-open', path])


# 瀏覽器緩存路徑 (如果你還是想讓 localStorage 生效)
CACHE_DIR = os.path.join(get_root_path(), "web_cache")


class Api:

    def upload_image(self, request):
        """
        將單張的上傳圖片壓縮後再傳回前端
        :param request:
        :return:
        """
        data = UploadImage(request)
        try:
            base64_image = data.compress_image()
            return Response(status=200, data=base64_image).to_dict()
        except Exception as e:
            return Response(status=500, data=str(e)).to_dict()

    def crop_image(self, request):
        """
        切割長截圖
        :param request
        :return:
        """
        try:
            image = LongScreenImage(request)
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
            open_file(data.path)
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
        selected_path = None
        match mode:
            case 'word':
                selected_path = webview.windows[0].create_file_dialog(
                    webview.FileDialog.SAVE,
                    save_filename=f'{title}.docx',
                    file_types=('WORD 文件 (*.docx)',)
                )
            case 'json':
                selected_path = webview.windows[0].create_file_dialog(
                    webview.FileDialog.SAVE,
                    save_filename=f'{title}.json',
                    file_types=('JSON 文件 (*.json)',)
                )
            case 'images':
                selected_path = webview.windows[0].create_file_dialog(
                    webview.FileDialog.FOLDER,
                    allow_multiple=False
                )
            case 'project-save':
                selected_path = webview.windows[0].create_file_dialog(
                    webview.FileDialog.FOLDER,
                    allow_multiple=False
                )
            case 'project-open':
                selected_path = webview.windows[0].create_file_dialog(
                    webview.FileDialog.FOLDER,
                    allow_multiple=False
                )
            case _:
                return Response(400, message='參數錯誤').to_dict()

        # pywebview 在不同平台/版本可能回傳字串或路徑序列。
        file_path = normalize_dialog_path(selected_path)

        if file_path and mode == 'project-save':
            file_path = build_project_save_path(file_path, title)

        if not file_path:
            if mode == 'project-open':
                error_text = '已取消開啟專案'
            elif mode == 'project-save':
                error_text = '已取消儲存專案'
            else:
                error_text = '已取消儲存'
            log().error(error_text)
            return Response(400, error_text).to_dict()
        log().info(f'選擇存檔位置：{file_path}')
        return Response(200, file_path).to_dict()


if __name__ == '__main__':
    if DEBUG_MODE:
        log().error('注意！！DEBUG模式已開啟！！')
    log().info('請耐心等待程式開啟......')
    start_fastapi_server()
    api = Api()
    url = get_frontend_url()
    window = webview.create_window(
        title='貼圖小鴿手',
        url=url,
        js_api=api,
        min_size=(800, 500),
        maximized=True,
        confirm_close=True,
    )
    log().debug('程式開啟成功')
    webview.start(
        debug=DEBUG_MODE,
        storage_path=CACHE_DIR,
        private_mode=False,
    )
