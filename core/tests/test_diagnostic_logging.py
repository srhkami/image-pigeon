import io
import logging
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api import create_app
from app.models import Item, ProjectV2
from app.session_store import create_session, get_image_path, get_session_dir


def _image_bytes(size=(1200, 900)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size=size, color="green").save(buffer, format="PNG")
    return buffer.getvalue()


class DiagnosticLoggingTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)
        self.events: list[tuple[int, str, dict]] = []

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def _record(self, level: int, event: str, **fields: object) -> None:
        self.events.append((level, event, fields))

    def test_post_request_logs_safe_summary_without_multipart_body(self):
        with patch("core.handle_log.log_event", side_effect=self._record):
            client = TestClient(create_app(session_base_dir=self.base_dir))
            response = client.post(
                "/api/images/import",
                data={"quality": "75", "min_size": "1000", "remark": "私人備註"},
                files={"files": ("private-name.png", _image_bytes(), "image/png")},
                headers={"X-Request-ID": "01234567-89ab-cdef-0123-456789abcdef"},
            )

        self.assertEqual(response.status_code, 200)
        api_events = [entry for entry in self.events if entry[1] == "api.request_completed"]
        self.assertEqual(len(api_events), 1)
        level, _, fields = api_events[0]
        self.assertEqual(level, logging.INFO)
        self.assertEqual(fields["method"], "POST")
        self.assertEqual(fields["route"], "/api/images/import")
        self.assertEqual(fields["status"], 200)
        self.assertEqual(fields["operation_id"], "01234567-89ab-cdef-0123-456789abcdef")
        rendered = repr(self.events)
        self.assertNotIn("private-name.png", rendered)
        self.assertNotIn("私人備註", rendered)
        self.assertNotIn(_image_bytes()[:12].hex(), rendered)

    def test_successful_image_get_does_not_log_info_request_summary(self):
        session_id = create_session(base_dir=self.base_dir)
        project = ProjectV2(assets=[{"id": "asset_1", "file": "images/asset_1.webp", "size": 0}])
        image_path = get_image_path(session_id, "asset_1", base_dir=self.base_dir)
        image_path.parent.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(b"image")
        get_session_dir(session_id, base_dir=self.base_dir).joinpath("session.json").write_text(
            '{"sessionId": "' + session_id + '", "project": ' + project.model_dump_json(by_alias=True) + ', "createdAt": "2026-01-01T00:00:00+00:00", "updatedAt": "2026-01-01T00:00:00+00:00"}',
            encoding="utf-8",
        )

        with patch("core.handle_log.log_event", side_effect=self._record):
            response = TestClient(create_app(session_base_dir=self.base_dir)).get(
                f"/api/sessions/{session_id}/assets/asset_1/image"
            )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(any(level == logging.INFO and event == "api.request_completed" for level, event, _ in self.events))

    def test_unhandled_exception_logs_once_then_reraises(self):
        app = create_app(session_base_dir=self.base_dir)

        @app.get("/api/test-crash")
        def crash() -> None:
            raise RuntimeError("secret /Users/example/private.png")

        with patch("core.handle_log.log_event", side_effect=self._record):
            with self.assertRaises(RuntimeError):
                TestClient(app, raise_server_exceptions=True).get("/api/test-crash")

        failures = [entry for entry in self.events if entry[1] == "api.unhandled_exception"]
        self.assertEqual(len(failures), 1)
        self.assertEqual(failures[0][0], logging.ERROR)
        self.assertEqual(failures[0][2]["method"], "GET")
        self.assertEqual(failures[0][2]["route"], "/api/test-crash")
        self.assertEqual(failures[0][2]["error_type"], "RuntimeError")
        self.assertNotIn("secret", repr(failures))

    def test_session_cleanup_logs_warning_for_corrupt_metadata(self):
        corrupt = get_session_dir("corrupt-session", base_dir=self.base_dir)
        corrupt.mkdir(parents=True)
        corrupt.joinpath("session.json").write_text("not json", encoding="utf-8")

        with patch("core.handle_log.log_event", side_effect=self._record):
            from app.session_store import clean_expired_sessions
            self.assertEqual(clean_expired_sessions(base_dir=self.base_dir), [])

        self.assertIn((logging.WARNING, "session.cleanup_skipped", {"stage": "metadata", "error_type": "JSONDecodeError"}), self.events)

    def test_project_save_and_open_log_safe_summaries(self):
        session_id = create_session(base_dir=self.base_dir)
        project = ProjectV2(
            document={"title": "私密專案"},
            assets=[{"id": "asset_1", "file": "images/asset_1.webp", "size": 0}],
            items=[Item(id="item_1", assetId="asset_1", remark="不可記錄的備註")],
        )
        project.layouts[0].item_order.append("item_1")
        image_path = get_image_path(session_id, "asset_1", base_dir=self.base_dir)
        image_path.parent.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(b"image")
        target = self.base_dir / "private-project.ipigeon"

        with patch("core.handle_log.log_event", side_effect=self._record):
            from app.project_service import open_project_folder, save_project_folder
            save_project_folder(session_id, project, target, session_base_dir=self.base_dir)
            open_project_folder(target, session_base_dir=self.base_dir)

        names = [event for _, event, _ in self.events]
        self.assertEqual(names.count("project.save_started"), 1)
        self.assertEqual(names.count("project.save_completed"), 1)
        self.assertEqual(names.count("project.open_started"), 1)
        self.assertEqual(names.count("project.open_completed"), 1)
        completed = next(fields for _, event, fields in self.events if event == "project.save_completed")
        self.assertEqual(completed["asset_count"], 1)
        self.assertEqual(completed["item_count"], 1)
        self.assertEqual(completed["order_count"], 1)
        rendered = repr(self.events)
        self.assertNotIn("不可記錄的備註", rendered)
        self.assertNotIn(str(target), rendered)
