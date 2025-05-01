import webview
import json


class Api:
  def save_data(self, data):
    print("收到的資料：", data)
    return "OK"

  def send_text(self, text):
    print("收到的文字：", text)
    return 'OK'


if __name__ == '__main__':
  api = Api()
  window = webview.create_window('照片整理器', 'http://localhost:5173', js_api=api)
  webview.start(debug=True)
