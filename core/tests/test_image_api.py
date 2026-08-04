import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api import create_app


def _build_image_bytes(size=(1200, 900), image_format="PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size=size, color="green").save(buffer, format=image_format)
    buffer.seek(0)
    return buffer.getvalue()


class ImageApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)
        self.app = create_app(session_base_dir=self.base_dir)
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def test_import_single_image_creates_session_and_updates_project(self):
        response = self.client.post(
            "/api/images/import",
            data={"quality": "75", "min_size": "1000"},
            files={"files": ("photo.png", _build_image_bytes(), "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertEqual(payload["message"], "新增成功")
        data = payload["data"]

        session_id = data["sessionId"]
        self.assertTrue(session_id)
        self.assertEqual(len(data["assets"]), 1)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(len(data["layoutPatch"]["appendItemOrder"]), 1)
        self.assertEqual(data["items"][0]["layoutPreference"], "stacked-2")

        session_file = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / session_id
            / "session.json"
        )
        loaded = json.loads(session_file.read_text(encoding="utf-8"))
        project = loaded["project"]
        self.assertEqual(len(project["assets"]), 1)
        self.assertEqual(len(project["items"]), 1)
        self.assertEqual(len(project["layouts"][0]["itemOrder"]), 1)

        asset_id = data["assets"][0]["id"]
        image_response = self.client.get(f"/api/sessions/{session_id}/assets/{asset_id}/image")
        self.assertEqual(image_response.status_code, 200)
        self.assertTrue(image_response.headers["content-type"].startswith("image/webp"))

    def test_import_twice_reuses_session_and_appends_layout_order(self):
        response_one = self.client.post(
            "/api/images/import",
            data={"quality": "75", "min_size": "1000"},
            files={"files": ("first.png", _build_image_bytes((1300, 900), "PNG"), "image/png")},
        )
        self.assertEqual(response_one.status_code, 200)
        session_id = response_one.json()["data"]["sessionId"]

        response_two = self.client.post(
            "/api/images/import",
            data={"session_id": session_id, "quality": "75", "min_size": "1000"},
            files={"files": ("second.jpg", _build_image_bytes((800, 800), "JPEG"), "image/jpeg")},
        )
        self.assertEqual(response_two.status_code, 200)

        self.assertEqual(response_two.json()["data"]["sessionId"], session_id)
        self.assertEqual(len(response_two.json()["data"]["assets"]), 1)

        session_file = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / session_id
            / "session.json"
        )
        loaded = json.loads(session_file.read_text(encoding="utf-8"))
        self.assertEqual(len(loaded["project"]["assets"]), 2)
        self.assertEqual(len(loaded["project"]["items"]), 2)
        self.assertEqual(len(loaded["project"]["layouts"][0]["itemOrder"]), 2)

    def test_all_bad_files_return_400_with_errors(self):
        response = self.client.post(
            "/api/images/import",
            data={"quality": "75", "min_size": "1000"},
            files={"files": ("bad.txt", b"not-an-image", "text/plain")},
        )

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertEqual(payload["status"], 400)
        self.assertEqual(len(payload["data"]["errors"]), 1)
        self.assertEqual(len(payload["data"]["skipped"]), 1)
        self.assertEqual(payload["data"]["assets"], [])

    def test_partial_success_reports_skipped_and_errors(self):
        valid_bytes = _build_image_bytes()
        bad_bytes = b"not-an-image"

        response = self.client.post(
            "/api/images/import",
            data={"quality": "75", "min_size": "1000"},
            files=[
                ("files", ("good.png", valid_bytes, "image/png")),
                ("files", ("bad.txt", bad_bytes, "text/plain")),
            ],
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertEqual(len(payload["data"]["assets"]), 1)
        self.assertEqual(len(payload["data"]["errors"]), 1)
        self.assertEqual(len(payload["data"]["skipped"]), 1)

        session_id = payload["data"]["sessionId"]
        session_file = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / session_id
            / "session.json"
        )
        loaded = json.loads(session_file.read_text(encoding="utf-8"))
        self.assertEqual(len(loaded["project"]["assets"]), 1)
        self.assertEqual(len(loaded["project"]["items"]), 1)
        self.assertEqual(len(loaded["project"]["layouts"][0]["itemOrder"]), 1)
