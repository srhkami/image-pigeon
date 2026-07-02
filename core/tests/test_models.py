import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models import Crop, Item, ProjectV2


class ModelContractTest(unittest.TestCase):
    def test_project_v2_defaults_and_schema_version(self):
        project = ProjectV2()

        self.assertEqual(project.schema, "image-pigeon.project")
        self.assertEqual(project.version, 2)
        self.assertEqual(len(project.layouts), 1)

        layout = project.layouts[0]
        self.assertEqual(layout.type, "word-compatible-grid")
        self.assertEqual(layout.item_order, [])

    def test_project_v2_serialization_roundtrip(self):
        project = ProjectV2(
            items=[
                {
                    "id": "item_001",
                    "assetId": "asset_001",
                    "remark": "備註",
                }
            ]
        )
        dumped = project.model_dump(by_alias=True)
        loaded = ProjectV2.model_validate(dumped)

        self.assertEqual(loaded.schema, "image-pigeon.project")
        self.assertEqual(loaded.version, 2)
        self.assertEqual(dumped["items"][0]["assetId"], "asset_001")
        self.assertEqual(dumped["items"][0]["crop"]["x"], 0)
        self.assertEqual(dumped["layouts"][0]["type"], "word-compatible-grid")
        self.assertEqual(loaded.items[0].asset_id, "asset_001")
        self.assertEqual(loaded.items[0].type, "image")
        self.assertEqual(loaded.items[0].crop.x, 0)
        self.assertEqual(loaded.items[0].crop.y, 0)
        self.assertEqual(loaded.items[0].crop.width, 1)
        self.assertEqual(loaded.items[0].crop.height, 1)
        self.assertEqual(loaded.items[0].crop.unit, "ratio")

    def test_crop_defaults(self):
        crop = Crop()

        self.assertEqual(crop.x, 0)
        self.assertEqual(crop.y, 0)
        self.assertEqual(crop.width, 1)
        self.assertEqual(crop.height, 1)
        self.assertEqual(crop.unit, "ratio")

    def test_item_has_default_crop(self):
        item = Item(id="item_001", assetId="asset_001")
        self.assertEqual(item.crop.x, 0)
        self.assertEqual(item.crop.y, 0)
        self.assertEqual(item.crop.width, 1)
        self.assertEqual(item.crop.height, 1)
        self.assertEqual(item.crop.unit, "ratio")

    def test_item_portrait_size_default_large(self):
        item = Item(id="item_001", assetId="asset_001")
        self.assertEqual(item.portrait_size, "large")

    def test_item_portrait_size_alias_roundtrip(self):
        item = Item(id="item_001", assetId="asset_001", portraitSize="small")
        dumped = item.model_dump(by_alias=True)
        loaded = Item.model_validate(dumped)

        self.assertEqual(dumped["portraitSize"], "small")
        self.assertEqual(loaded.portrait_size, "small")

    def test_project_load_old_json_without_portraitSize(self):
        legacy_payload = {
            "items": [{"id": "item_001", "assetId": "asset_001", "remark": "legacy"}],
            "assets": [{"id": "asset_001", "file": "images/asset_001.webp", "mime": "image/webp", "width": 100, "height": 200, "size": 1024}],
        }

        project = ProjectV2.model_validate(legacy_payload)
        self.assertEqual(len(project.items), 1)
        self.assertEqual(project.items[0].portrait_size, "large")
