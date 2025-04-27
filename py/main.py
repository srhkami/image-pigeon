import webview

class Api:
    def save_data(self, data):
        print("收到的資料：", data)
        return "OK"

if __name__ == '__main__':
    api = Api()
    window = webview.create_window('照片整理器', 'http://localhost:5173', js_api=api)
    webview.start(debug=True)