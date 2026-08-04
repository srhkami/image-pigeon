import unittest
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api import create_app
import main


class ApiHealthTest(unittest.TestCase):
    def test_health_returns_app_metadata(self):
        client = TestClient(create_app())

        response = client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": 200, "message": "ok", "data": {"app": "image-pigeon"}},
        )

    def test_main_production_frontend_url_uses_local_fastapi(self):
        self.assertEqual(main.get_frontend_url(), "http://127.0.0.1:18765")

    def test_static_dir_uses_project_dist_in_development(self):
        self.assertEqual(Path(main.get_static_dir()), Path.cwd() / "dist")

    def test_static_dir_uses_pyinstaller_meipass_when_frozen(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dist_dir = Path(temp_dir) / "dist"
            dist_dir.mkdir()
            (dist_dir / "index.html").write_text("<div>packed</div>", encoding="utf-8")

            with (
                patch.object(sys, "frozen", True, create=True),
                patch.object(sys, "_MEIPASS", temp_dir, create=True),
            ):
                self.assertEqual(Path(main.get_static_dir()), dist_dir)

    def test_pywebview_api_exposes_select_path(self):
        api = main.Api()

        self.assertTrue(hasattr(api, "select_path"))
        self.assertTrue(callable(api.select_path))

    def test_build_project_save_path_creates_ipigeon_folder_name(self):
        self.assertEqual(
            main.build_project_save_path("/tmp", "我的/專案"),
            "/tmp/我的_專案.ipigeon",
        )
        self.assertEqual(
            main.build_project_save_path("/tmp", "already.ipigeon"),
            "/tmp/already.ipigeon",
        )

    def test_normalize_dialog_path_accepts_string_or_sequence(self):
        self.assertEqual(
            main.normalize_dialog_path("/Users/demo/output.docx"),
            "/Users/demo/output.docx",
        )
        self.assertEqual(
            main.normalize_dialog_path(["/Users/demo/output.docx"]),
            "/Users/demo/output.docx",
        )
        self.assertIsNone(main.normalize_dialog_path(None))
        self.assertIsNone(main.normalize_dialog_path([]))

    def test_dialog_directory_falls_back_when_home_environment_is_missing(self):
        with (
            patch.dict(os.environ, {}, clear=True),
            patch("pathlib.Path.home", side_effect=RuntimeError("home unavailable")),
        ):
            directory = main.resolve_dialog_directory()

        self.assertTrue(Path(directory).is_dir())

    def test_all_file_dialog_modes_receive_an_explicit_directory(self):
        window = MagicMock()
        window.create_file_dialog.return_value = None

        with patch.object(main.webview, "windows", [window]):
            for mode in ("word", "json", "images", "project-save", "project-open"):
                with self.subTest(mode=mode):
                    main.Api().select_path({"mode": mode, "title": "測試"})
                    _, kwargs = window.create_file_dialog.call_args
                    self.assertTrue(kwargs["directory"])
                    self.assertTrue(Path(kwargs["directory"]).is_dir())

    def test_file_dialog_exception_returns_stable_error_response(self):
        window = MagicMock()
        window.create_file_dialog.side_effect = KeyError("HOMEPATH")

        with patch.object(main.webview, "windows", [window]):
            response = main.Api().select_path({"mode": "word", "title": "測試"})

        self.assertEqual(response["status"], 500)
        self.assertEqual(response["message"], "無法開啟檔案選擇視窗，請重新啟動程式後再試")


if __name__ == "__main__":
    unittest.main()
