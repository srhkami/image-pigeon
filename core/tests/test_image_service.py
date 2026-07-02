import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.image_service import ImageImportError, import_image_bytes_to_session


class ImageServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def _make_image_bytes(self, size: tuple[int, int], image_format: str = "PNG") -> bytes:
        buffer = BytesIO()
        Image.new("RGB", size=size, color="blue").save(buffer, format=image_format)
        buffer.seek(0)
        return buffer.getvalue()

    def test_import_png_bytes_generates_webp_asset_and_item(self):
        png_bytes = self._make_image_bytes((1200, 1000), image_format="PNG")

        asset, item = import_image_bytes_to_session(
            png_bytes,
            session_id="session-01",
            original_filename="photo.png",
            quality=75,
            min_size=1000,
            session_base_dir=self.base_dir,
        )

        saved_image_path = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / "session-01"
            / "images"
            / f"{asset.id}.webp"
        )
        self.assertTrue(saved_image_path.exists())

        with Image.open(saved_image_path) as webp_image:
            self.assertEqual(webp_image.format, "WEBP")
            self.assertEqual((webp_image.width, webp_image.height), (1200, 1000))

        self.assertEqual(asset.file, f"images/{asset.id}.webp")
        self.assertEqual(asset.mime, "image/webp")
        self.assertEqual(item.id, f"item_{asset.id}")
        self.assertEqual(item.asset_id, asset.id)
        self.assertEqual(item.crop.width, 1)

    def test_import_jpg_bytes_is_resized_when_too_large(self):
        large_jpg = self._make_image_bytes((2400, 1200), image_format="JPEG")

        asset, _ = import_image_bytes_to_session(
            large_jpg,
            session_id="session-02",
            original_filename="long.jpg",
            quality=75,
            min_size=1000,
            session_base_dir=self.base_dir,
        )

        saved_image_path = (
            self.base_dir
            / "web_cache"
            / "temp"
            / "sessions"
            / "session-02"
            / "images"
            / f"{asset.id}.webp"
        )
        with Image.open(saved_image_path) as webp_image:
            self.assertEqual(webp_image.size, (1200, 600))
        self.assertEqual(asset.width, 1200)
        self.assertEqual(asset.height, 600)

    def test_import_invalid_bytes_raises_image_import_error(self):
        with self.assertRaises(ImageImportError):
            import_image_bytes_to_session(
                b"not-an-image",
                session_id="session-03",
                original_filename="bad.bin",
                quality=75,
                min_size=1000,
                session_base_dir=self.base_dir,
            )
