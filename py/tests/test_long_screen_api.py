import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.api import create_app


def _build_image_bytes(size=(400, 1800), image_format="PNG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size=size, color="green").save(buffer, format=image_format)
    buffer.seek(0)
    return buffer.getvalue()


class LongScreenApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)
        self.app = create_app(session_base_dir=self.base_dir)
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def test_import_long_screen_upload_creates_multiple_segments(self):
        response = self.client.post(
            "/api/images/import-long-screen",
            data={"quality": "75", "min_size": "1000"},
            files={"file": ("long.png", _build_image_bytes(), "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertEqual(payload["message"], "新增成功")

        data = payload["data"]
        self.assertEqual(data["segments"], 3)
        self.assertEqual(len(data["assets"]), 3)
        self.assertEqual(len(data["items"]), 3)
        self.assertEqual(len(data["layoutPatch"]["appendItemOrder"]), 3)

        session_id = data["sessionId"]
        session_file = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / session_id
            / "session.json"
        )
        session_payload = json.loads(session_file.read_text(encoding="utf-8"))
        project = session_payload["project"]
        self.assertEqual(len(project["assets"]), 3)
        self.assertEqual(len(project["items"]), 3)
        self.assertEqual(len(project["layouts"][0]["itemOrder"]), 3)

        for item in data["assets"]:
            asset_id = item["id"]
            image_response = self.client.get(f"/api/sessions/{session_id}/assets/{asset_id}/image")
            self.assertEqual(image_response.status_code, 200)
            self.assertTrue(image_response.headers["content-type"].startswith("image/webp"))

            with Image.open(io.BytesIO(image_response.content)) as image:
                self.assertEqual(image.format, "WEBP")

    def test_import_non_long_screen_returns_400(self):
        response = self.client.post(
            "/api/images/import-long-screen",
            data={"quality": "75", "min_size": "1000"},
            files={"file": ("normal.png", _build_image_bytes((1200, 1000), "PNG"), "image/png")},
        )

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertEqual(payload["status"], 400)
        self.assertIn("長截圖", payload["message"])
        self.assertIn("長截圖", payload["detail"])

    def test_import_long_screen_keeps_only_webp_segments(self):
        response = self.client.post(
            "/api/images/import-long-screen",
            data={"quality": "75", "min_size": "1000"},
            files={"file": ("long.png", _build_image_bytes(), "image/png")},
        )

        data = response.json()["data"]
        self.assertEqual(response.status_code, 200)

        session_dir = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / data["sessionId"]
            / "images"
        )
        files = [path for path in session_dir.iterdir() if path.is_file()]
        self.assertEqual(len(files), data["segments"])
        self.assertTrue(all(path.suffix == ".webp" for path in files))
