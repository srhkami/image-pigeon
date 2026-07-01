import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.image_service import NotLongScreenshotError, import_long_screen_bytes_to_session


class LongScreenServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def _build_image_bytes(self, size: tuple[int, int], image_format: str = "PNG") -> bytes:
        buffer = BytesIO()
        Image.new("RGB", size=size, color="blue").save(buffer, format=image_format)
        buffer.seek(0)
        return buffer.getvalue()

    def test_long_screen_is_split_into_segments_and_saved_as_webp(self):
        long_png = self._build_image_bytes((400, 1800), image_format="PNG")

        results = import_long_screen_bytes_to_session(
            long_png,
            session_id="session-long",
            original_filename="long.png",
            quality=75,
            min_size=1000,
            session_base_dir=self.base_dir,
        )

        assets_items = results
        self.assertEqual(len(assets_items), 3)

        for asset, item in assets_items:
            image_path = (
                self.base_dir
                / "web_cache"
                / "temp"
                / "sessions"
                / "session-long"
                / "images"
                / f"{asset.id}.webp"
            )
            self.assertTrue(image_path.exists())

            with Image.open(image_path) as webp_image:
                self.assertEqual(webp_image.format, "WEBP")
                self.assertEqual((webp_image.width, webp_image.height), (400, 848))

            self.assertEqual((asset.width, asset.height), (400, 848))
            self.assertEqual(asset.file, f"images/{asset.id}.webp")
            self.assertEqual(item.id, f"item_{asset.id}")

    def test_non_long_screenshot_raises_domain_error(self):
        non_long = self._build_image_bytes((1200, 1200), image_format="PNG")

        with self.assertRaises(NotLongScreenshotError):
            import_long_screen_bytes_to_session(
                non_long,
                session_id="session-non-long",
                original_filename="square.png",
                quality=75,
                min_size=1000,
                session_base_dir=self.base_dir,
            )
