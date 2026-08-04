import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models import Crop, Item, ProjectV2
from app.project_service import (
    ProjectAssetError,
    ProjectNotFoundError,
    open_project_folder,
    save_project_folder,
)
from app.session_store import create_session, get_image_path


def _build_webp_bytes(size=(16, 16), color="blue") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size=size, color=color).save(buffer, format="WEBP")
    buffer.seek(0)
    return buffer.getvalue()


class ProjectServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def _create_project_with_asset(self, rotation: int = 0) -> tuple[str, ProjectV2]:
        asset_id = "asset_1"
        item = Item(
            id="item_1",
            assetId=asset_id,
            remark="原始備註",
            rotation=rotation,
            crop=Crop(x=0.2, y=0.1, width=0.8, height=0.7),
        )
        project = ProjectV2(
            document={"title": "Phase 6A"},
            assets=[
                {
                    "id": asset_id,
                    "file": f"images/{asset_id}.webp",
                    "mime": "image/webp",
                    "originalName": "photo.webp",
                    "size": 123,
                }
            ],
            items=[item],
        )
        project.layouts[0].item_order.append(item.id)

        session_id = create_session(base_dir=self.base_dir)
        image_path = get_image_path(session_id, asset_id, base_dir=self.base_dir)
        image_path.parent.mkdir(parents=True, exist_ok=True)
        image_path.write_bytes(_build_webp_bytes())

        return session_id, project

    def test_save_project_folder_writes_project_json_and_images(self):
        session_id, project = self._create_project_with_asset(rotation=45)
        target_folder = self.base_dir / "saved_project.ipigeon"

        saved_project = save_project_folder(
            session_id=session_id,
            project_payload=project,
            target_path=target_folder,
            session_base_dir=self.base_dir,
        )

        self.assertEqual(saved_project.document.title, "Phase 6A")

        project_json_path = target_folder / "project.json"
        self.assertTrue(project_json_path.exists())

        stored = json.loads(project_json_path.read_text(encoding="utf-8"))
        self.assertEqual(stored["document"]["title"], "Phase 6A")
        self.assertNotIn("wordOptions", stored)
        self.assertNotIn("saveImages", stored)
        self.assertEqual(stored["items"][0]["layoutPreference"], "side-by-side-2")

        target_image = target_folder / project.assets[0].file
        self.assertTrue(target_image.exists())

    def test_open_project_folder_creates_new_session_and_preserves_metadata(self):
        session_id, project = self._create_project_with_asset(rotation=90)
        target_folder = self.base_dir / "open_project.ipigeon"
        images_dir = target_folder / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        src_image = target_folder / project.assets[0].file

        target_image = get_image_path(session_id, project.assets[0].id, base_dir=self.base_dir)
        src_image.write_bytes(target_image.read_bytes())

        project_json_path = target_folder / "project.json"
        project_json_path.write_text(
            json.dumps(project.model_dump(by_alias=True), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        opened_session_id, opened_project = open_project_folder(
            target_folder,
            session_base_dir=self.base_dir,
        )

        self.assertNotEqual(opened_session_id, session_id)
        self.assertEqual(opened_project.items[0].remark, "原始備註")
        self.assertEqual(opened_project.items[0].rotation, 90)
        self.assertEqual(opened_project.items[0].crop.width, 0.8)
        self.assertEqual(opened_project.layouts[0].item_order, ["item_1"])
        self.assertEqual(opened_project.items[0].layout_preference, "side-by-side-2")

        opened_image = get_image_path(opened_session_id, project.assets[0].id, base_dir=self.base_dir)
        self.assertTrue(opened_image.exists())

    def test_rejects_asset_file_that_escapes_project_folder(self):
        session_id, project = self._create_project_with_asset()
        project.assets[0].file = "../evil.webp"

        with self.assertRaises(ProjectAssetError):
            save_project_folder(
                session_id=session_id,
                project_payload=project,
                target_path=self.base_dir / "escape_save",
                session_base_dir=self.base_dir,
            )

        open_root = self.base_dir / "escape_open"
        (open_root / "images").mkdir(parents=True)
        open_root.joinpath("project.json").write_text(
            json.dumps(project.model_dump(by_alias=True), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        with self.assertRaises(ProjectAssetError):
            open_project_folder(open_root, session_base_dir=self.base_dir)

    def test_open_missing_project_json_fails(self):
        missing_root = self.base_dir / "missing"
        missing_root.mkdir(parents=True, exist_ok=True)

        with self.assertRaises(ProjectNotFoundError):
            open_project_folder(missing_root, session_base_dir=self.base_dir)
