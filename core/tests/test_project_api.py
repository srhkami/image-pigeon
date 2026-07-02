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
from app.models import Item, ProjectV2
from app.session_store import create_session, get_image_path


def _build_webp_bytes(size=(24, 24), color="green") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size=size, color=color).save(buffer, format="WEBP")
    buffer.seek(0)
    return buffer.getvalue()


class ProjectApiTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)
        self.client = TestClient(create_app(session_base_dir=self.base_dir))

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def _make_session_with_project(self) -> tuple[str, ProjectV2]:
        session_id = create_session(base_dir=self.base_dir)
        item = Item(id="item_1", assetId="asset_1", remark="API 備註", rotation=30)
        project = ProjectV2(document={"title": "API 專案"}, assets=[{"id": "asset_1", "file": "images/asset_1.webp", "size": 0}], items=[item])
        project.layouts[0].item_order.append(item.id)

        image_path = get_image_path(session_id, "asset_1", base_dir=self.base_dir)
        image_path.parent.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(_build_webp_bytes())
        return session_id, project

    def _make_project_folder(self, project: ProjectV2) -> Path:
        folder = self.base_dir / "roundtrip.ipigeon"
        folder.mkdir(parents=True)
        (folder / "images").mkdir(parents=True, exist_ok=True)
        session_image = get_image_path("temp-open", "asset_1", base_dir=self.base_dir)
        session_image.parent.mkdir(parents=True, exist_ok=True)
        session_image.write_bytes(_build_webp_bytes(color="orange"))

        asset_path = folder / "images" / "asset_1.webp"
        asset_path.write_bytes(session_image.read_bytes())
        (folder / "project.json").write_text(
            json.dumps(project.model_dump(by_alias=True), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return folder

    def test_save_project_endpoint_roundtrip(self):
        session_id, project = self._make_session_with_project()
        target_dir = self.base_dir / "saved_project.ipigeon"

        response = self.client.post(
            "/api/project/save",
            json={
                "sessionId": session_id,
                "project": project.model_dump(by_alias=True),
                "targetPath": str(target_dir),
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertEqual(payload["data"]["path"], str(target_dir.resolve()))
        self.assertTrue((target_dir / "project.json").exists())
        self.assertTrue((target_dir / "images" / "asset_1.webp").exists())

    def test_open_project_endpoint_returns_new_session_and_project(self):
        session_id, project = self._make_session_with_project()
        project_folder = self._make_project_folder(project)

        response = self.client.post(
            "/api/project/open",
            json={"projectPath": str(project_folder)},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertIn("sessionId", payload["data"])
        self.assertEqual(payload["data"]["project"]["items"][0]["remark"], "API 備註")
        self.assertEqual(payload["data"]["project"]["items"][0]["rotation"], 30)

        opened_session_id = payload["data"]["sessionId"]
        image_response = self.client.get(
            f"/api/sessions/{opened_session_id}/assets/{project.assets[0].id}/image"
        )
        self.assertEqual(image_response.status_code, 200)
        self.assertTrue(image_response.headers["content-type"].startswith("image/webp"))

    def test_open_missing_or_unsafe_project_returns_error(self):
        missing_folder = self.base_dir / "not_exists"
        response = self.client.post(
            "/api/project/open",
            json={"projectPath": str(missing_folder)},
        )
        self.assertNotEqual(response.status_code, 200)
        missing_payload = response.json()
        self.assertIn("status", missing_payload)

        unsafe_folder = self.base_dir / "unsafe"
        unsafe_folder.mkdir(parents=True)
        unsafe_project = ProjectV2(document={"title": "unsafe"}, assets=[
            {
                "id": "asset_bad",
                "file": "../evil.webp",
                "size": 0,
            }
        ], items=[Item(id="item_bad", assetId="asset_bad")])
        (unsafe_folder / "images").mkdir(parents=True)
        (unsafe_folder / "project.json").write_text(
            json.dumps(unsafe_project.model_dump(by_alias=True), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        response2 = self.client.post(
            "/api/project/open",
            json={"projectPath": str(unsafe_folder)},
        )

        self.assertNotEqual(response2.status_code, 200)
        self.assertIn("status", response2.json())
