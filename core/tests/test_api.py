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

    def test_frontend_diagnostic_accepts_only_fixed_schema_and_does_not_reflect_payload(self):
        payload = {
            "event": "frontend.request_failed",
            "route": "/api/images/import",
            "status": 503,
            "error_type": "network_error",
            "detail_code": "fetch_failed",
            "duration_ms": 12,
            "operation_id": "123e4567-e89b-12d3-a456-426614174000",
        }
        with patch("main.log_event") as log_event:
            accepted = main.Api().record_frontend_diagnostic(payload)
            rejected = main.Api().record_frontend_diagnostic({
                **payload,
                "message": "private error text\\nforbidden",
            })

        self.assertEqual(accepted, {"status": 200, "message": "診斷事件已接受", "data": None})
        self.assertEqual(rejected, {"status": 400, "message": "診斷事件已拒絕", "data": None})
        log_event.assert_called_once_with(
            40,
            "frontend.request_failed",
            route="/api/images/import",
            status=503,
            error_type="network_error",
            detail_code="fetch_failed",
            duration_ms=12,
            operation_id="123e4567-e89b-12d3-a456-426614174000",
        )

    def test_frontend_diagnostic_rejects_unknown_control_characters_and_invalid_operation_id(self):
        payload = {
            "event": "frontend.request_failed",
            "route": "/api/images/import",
            "status": 500,
            "error_type": "http_error",
            "detail_code": "non_2xx",
            "duration_ms": 0,
            "operation_id": "123e4567-e89b-12d3-a456-426614174000",
        }
        api = main.Api()
        self.assertEqual(api.record_frontend_diagnostic({**payload, "route": "/api/images/import\\nsecret"})["status"], 400)
        self.assertEqual(api.record_frontend_diagnostic({**payload, "operation_id": "invalid"})["status"], 400)
        self.assertEqual(api.record_frontend_diagnostic({**payload, "body": {"secret": "value"}})["status"], 400)

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

    def test_select_path_cancel_is_info_event_not_error(self):
        window = MagicMock()
        window.create_file_dialog.return_value = None

        with (
            patch.object(main.webview, "windows", [window]),
            patch("main.log_event") as log_event,
            patch.object(main.log(), "error") as error_log,
        ):
            response = main.Api().select_path({"mode": "word", "title": "私人標題"})

        self.assertEqual(response, {"status": 400, "message": "已取消儲存", "data": None})
        error_log.assert_not_called()
        self.assertEqual([call.args[1] for call in log_event.call_args_list], ["file_dialog.opened", "file_dialog.cancelled"])
        self.assertEqual(log_event.call_args.kwargs["mode"], "word")

    def test_select_path_selected_event_does_not_include_private_path_or_title(self):
        private_path = "/private/person/private-output.docx"
        window = MagicMock()
        window.create_file_dialog.return_value = private_path

        with (
            patch.object(main.webview, "windows", [window]),
            patch("main.log_event") as log_event,
        ):
            response = main.Api().select_path({"mode": "word", "title": "私人標題"})

        self.assertEqual(response, {"status": 200, "message": private_path, "data": None})
        self.assertEqual(log_event.call_args.args[1], "file_dialog.selected")
        self.assertEqual(log_event.call_args.kwargs["mode"], "word")
        self.assertNotIn(private_path, repr(log_event.call_args))
        self.assertNotIn("私人標題", repr(log_event.call_args))


if __name__ == "__main__":
    unittest.main()
