import json
import logging
import os.path
import re
import subprocess
import sys
import threading
from time import perf_counter
from pathlib import Path

import webview

from core.app.api import create_app
from core.crop_image import LongScreenImage, crop_to_images
from core.handle_log import log, log_event, operation_context
from core.handle_request import OutputBaseData, Response
from core.save_docx import creat_docx, add_header, OutputWord
from core.save_images import SaveAsImages, open_folder, save
from core.upload_imags import UploadImage

DEBUG_MODE = False
FASTAPI_HOST = '127.0.0.1'
FASTAPI_PORT = 18765
VITE_DEV_URL = 'http://localhost:5195'

FRONTEND_DIAGNOSTIC_FIELDS = {
    'event', 'route', 'status', 'error_type', 'detail_code', 'duration_ms', 'operation_id',
}
FRONTEND_DIAGNOSTIC_EVENTS = {'frontend.request_failed', 'frontend.check_status_failed'}
FRONTEND_DIAGNOSTIC_ROUTES = {
    '/api/images/import', '/api/images/import-long-screen', '/api/project/save',
    '/api/project/open', 'pywebview.api',
}
FRONTEND_DIAGNOSTIC_ERROR_TYPES = {
    'network_error', 'non_json_response', 'http_error', 'invalid_response',
}
FRONTEND_DIAGNOSTIC_DETAIL_CODES = {
    'fetch_failed', 'non_json', 'non_2xx', 'invalid_response', 'status_not_200',
}
FRONTEND_DIAGNOSTIC_UUID = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)


def is_valid_frontend_diagnostic(payload) -> bool:
    if not isinstance(payload, dict) or set(payload) != FRONTEND_DIAGNOSTIC_FIELDS:
        return False
    return (
        payload['event'] in FRONTEND_DIAGNOSTIC_EVENTS
        and payload['route'] in FRONTEND_DIAGNOSTIC_ROUTES
        and payload['error_type'] in FRONTEND_DIAGNOSTIC_ERROR_TYPES
        and payload['detail_code'] in FRONTEND_DIAGNOSTIC_DETAIL_CODES
        and type(payload['status']) is int and 100 <= payload['status'] <= 599
        and type(payload['duration_ms']) is int and 0 <= payload['duration_ms'] <= 86_400_000
        and isinstance(payload['operation_id'], str)
        and FRONTEND_DIAGNOSTIC_UUID.fullmatch(payload['operation_id']) is not None
    )


def get_root_path():
    # 如果是打包後的 exe
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    # 如果是開發環境的 .core
    else:
        return os.path.dirname(os.path.abspath(__file__))


def get_project_root_path():
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


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


def resolve_dialog_directory() -> str:
    """取得確實存在的檔案選擇器初始資料夾，避免依賴單一環境變數。"""
    home_drive = os.environ.get('HOMEDRIVE', '')
    home_path = os.environ.get('HOMEPATH', '')
    candidates = [
        os.environ.get('USERPROFILE'),
        f'{home_drive}{home_path}' if home_drive and home_path else None,
        os.environ.get('HOME'),
    ]

    try:
        candidates.append(str(Path.home()))
    except (KeyError, OSError, RuntimeError):
        log().debug('無法取得使用者家目錄，改用應用程式路徑', exc_info=True)

    candidates.extend((get_root_path(), os.getcwd()))

    for candidate in candidates:
        if candidate and Path(candidate).is_dir():
            return str(Path(candidate))

    return os.path.abspath(os.curdir)


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

    def record_frontend_diagnostic(self, payload):
        """接受已固定 schema 的 pywebview 前端診斷事件；不建立 HTTP telemetry endpoint。"""
        if not is_valid_frontend_diagnostic(payload):
            return Response(status=400, message='診斷事件已拒絕').to_dict()
        log_event(
            logging.ERROR,
            payload['event'],
            route=payload['route'],
            status=payload['status'],
            error_type=payload['error_type'],
            detail_code=payload['detail_code'],
            duration_ms=payload['duration_ms'],
            operation_id=payload['operation_id'],
        )
        return Response(status=200, message='診斷事件已接受').to_dict()

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
        """儲存圖片成 docx 檔，並將寫檔與作業系統開啟分成兩個階段。"""
        data = OutputWord(request)
        page_count = len(data.pages)
        slot_count = sum(
            len(page.get('slots', []))
            for page in data.pages
            if isinstance(page, dict) and isinstance(page.get('slots', []), list)
        )
        started_at = perf_counter()
        with operation_context() as operation_id:
            log_event(
                logging.INFO,
                'output.word_started',
                operation_id=operation_id,
                item_count=data.file_count,
                page_count=page_count,
                slot_count=slot_count,
                mode='word',
            )
            try:
                doc = creat_docx(data)
                doc = add_header(doc, data.title)
                doc.save(data.path)
            except PermissionError:
                log_event(
                    logging.ERROR,
                    'output.word_failed',
                    operation_id=operation_id,
                    stage='write',
                    error_type='PermissionError',
                    detail_code='write_permission_denied',
                )
                return Response(500, '請先關閉相同檔名之檔案').to_dict()
            except Exception as error:
                log_event(
                    logging.ERROR,
                    'output.word_failed',
                    operation_id=operation_id,
                    stage='write',
                    error_type=type(error).__name__,
                    detail_code='write_failed',
                )
                return Response(500, '處理失敗，請回報作者').to_dict()

            duration_ms = int((perf_counter() - started_at) * 1000)
            log_event(
                logging.INFO,
                'output.word_completed',
                operation_id=operation_id,
                item_count=data.file_count,
                duration_ms=duration_ms,
            )
            try:
                open_file(data.path)
            except Exception as error:
                log_event(
                    logging.WARNING,
                    'output.word_open_failed',
                    operation_id=operation_id,
                    stage='open',
                    error_type=type(error).__name__,
                    detail_code='open_failed',
                )
                return Response(200, '儲存成功，但無法自動開啟檔案').to_dict()
            return Response(200, '儲存成功').to_dict()

    def save_images(self, request):
        """儲存壓縮後圖片，並將資料寫入與開啟資料夾分開處理。"""
        data = SaveAsImages(request)
        started_at = perf_counter()
        with operation_context() as operation_id:
            log_event(
                logging.INFO,
                'output.images_started',
                operation_id=operation_id,
                item_count=data.file_count,
                mode='images',
            )
            try:
                save(data)
            except Exception as error:
                log_event(
                    logging.ERROR,
                    'output.images_failed',
                    operation_id=operation_id,
                    stage='write',
                    error_type=type(error).__name__,
                    detail_code='write_failed',
                )
                return Response(500, '處理失敗，請回報作者').to_dict()

            log_event(
                logging.INFO,
                'output.images_completed',
                operation_id=operation_id,
                item_count=data.file_count,
                duration_ms=int((perf_counter() - started_at) * 1000),
            )
            try:
                open_folder(data.path)
            except Exception as error:
                log_event(
                    logging.WARNING,
                    'output.images_open_failed',
                    operation_id=operation_id,
                    stage='open',
                    error_type=type(error).__name__,
                    detail_code='open_failed',
                )
                return Response(200, '儲存成功，但無法自動開啟檔案').to_dict()
            return Response(200, '儲存成功').to_dict()

    def save_json(self, request):
        """儲存 legacy JSON，並在成功後以獨立階段交由作業系統開啟。"""
        data = OutputBaseData(request)
        started_at = perf_counter()
        with operation_context() as operation_id:
            log_event(
                logging.INFO,
                'output.json_started',
                operation_id=operation_id,
                item_count=data.file_count,
                mode='json',
            )
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
            except Exception as error:
                log_event(
                    logging.ERROR,
                    'output.json_failed',
                    operation_id=operation_id,
                    stage='write',
                    error_type=type(error).__name__,
                    detail_code='write_failed',
                )
                return Response(500, '處理失敗，請回報作者').to_dict()

            log_event(
                logging.INFO,
                'output.json_completed',
                operation_id=operation_id,
                item_count=data.file_count,
                duration_ms=int((perf_counter() - started_at) * 1000),
            )
            try:
                open_file(data.path)
            except Exception as error:
                log_event(
                    logging.WARNING,
                    'output.json_open_failed',
                    operation_id=operation_id,
                    stage='open',
                    error_type=type(error).__name__,
                    detail_code='open_failed',
                )
                return Response(200, '儲存成功，但無法自動開啟檔案').to_dict()
            return Response(200, '儲存成功').to_dict()

    def select_path(self, data):
        """
        選擇路徑
        :param data:
        :return:
        """
        mode = data.get('mode')
        title = data.get('title', '照片黏貼表')
        selected_path = None
        dialog_directory = resolve_dialog_directory()
        try:
            match mode:
                case 'word':
                    selected_path = webview.windows[0].create_file_dialog(
                        webview.FileDialog.SAVE,
                        directory=dialog_directory,
                        save_filename=f'{title}.docx',
                        file_types=('WORD 文件 (*.docx)',)
                    )
                case 'json':
                    selected_path = webview.windows[0].create_file_dialog(
                        webview.FileDialog.SAVE,
                        directory=dialog_directory,
                        save_filename=f'{title}.json',
                        file_types=('JSON 文件 (*.json)',)
                    )
                case 'images':
                    selected_path = webview.windows[0].create_file_dialog(
                        webview.FileDialog.FOLDER,
                        directory=dialog_directory,
                        allow_multiple=False
                    )
                case 'project-save':
                    selected_path = webview.windows[0].create_file_dialog(
                        webview.FileDialog.FOLDER,
                        directory=dialog_directory,
                        allow_multiple=False
                    )
                case 'project-open':
                    selected_path = webview.windows[0].create_file_dialog(
                        webview.FileDialog.FOLDER,
                        directory=dialog_directory,
                        allow_multiple=False
                    )
                case _:
                    return Response(400, message='參數錯誤').to_dict()
        except Exception as error:
            log_event(
                logging.ERROR,
                'file_dialog.failed',
                mode=mode if mode in {'word', 'json', 'images', 'project-save', 'project-open'} else 'invalid',
                stage='dialog',
                error_type=type(error).__name__,
                detail_code='dialog_open_failed',
            )
            return Response(500, '無法開啟檔案選擇視窗，請重新啟動程式後再試').to_dict()

        log_event(logging.INFO, 'file_dialog.opened', mode=mode)
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
            log_event(logging.INFO, 'file_dialog.cancelled', mode=mode)
            return Response(400, error_text).to_dict()
        log_event(logging.INFO, 'file_dialog.selected', mode=mode)
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
