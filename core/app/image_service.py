from __future__ import annotations

from pathlib import Path
import math
from typing import Any
from uuid import uuid4

from io import BytesIO

from PIL import Image, UnidentifiedImageError

from .models import Asset, Item, derive_layout_preference
from .session_store import get_image_path


class ImageImportError(ValueError):
    pass


class NotLongScreenshotError(ImageImportError):
    pass


def _validate_import_options(quality: int, min_size: int) -> tuple[int, int]:
    if quality < 1 or quality > 100:
        raise ImageImportError("quality 必須為 1 到 100")
    if min_size <= 0:
        raise ImageImportError("min_size 必須大於 0")
    return int(quality), int(min_size)


def _compact_image(image: Image.Image, min_size: int, quality: int) -> tuple[bytes, int, int]:
    if quality != 100 and (image.width >= min_size * 2 or image.height >= min_size * 2):
        image = image.resize((image.width // 2, image.height // 2))

    out_buffer = BytesIO()
    image.save(out_buffer, format="WEBP", quality=quality, method=6, optimize=True)
    out_buffer.seek(0)
    return out_buffer.read(), image.width, image.height


def _is_long_screenshot(width: int, height: int) -> bool:
    return width / height <= 9 / 21


def _split_long_screenshot(image: Image.Image) -> list[Image.Image]:
    width = image.width
    height = image.height
    if not _is_long_screenshot(width, height):
        return []

    segment_height = width * 2
    reserve_h = segment_height * 0.03
    blocks = math.ceil(height / segment_height)

    segments: list[Image.Image] = []
    for i in range(0, blocks):
        if i == 0:
            box = (0, 0, width, segment_height + reserve_h * 2)
        else:
            box = (0, i * segment_height - reserve_h, width, (i + 1) * segment_height + reserve_h)
        segments.append(image.crop(box))
    return segments


def import_image_bytes_to_session(
    file_data: bytes,
    session_id: str,
    original_filename: str | None = None,
    quality: int = 75,
    min_size: int = 1000,
    session_base_dir: str | Path | None = None,
) -> tuple[Asset, Item]:
    quality, min_size = _validate_import_options(quality, min_size)

    try:
        with Image.open(BytesIO(file_data)) as image:
            if image.mode not in {"RGB", "RGBA", "LA", "L"}:
                image = image.convert("RGB")

            webp_data, width, height = _compact_image(image, min_size=min_size, quality=quality)
    except UnidentifiedImageError as exc:
        raise ImageImportError("檔案不是可辨識的圖片格式") from exc
    except Exception as exc:
        raise ImageImportError(f"圖片處理失敗: {exc}") from exc

    asset_id = str(uuid4())
    item_id = f"item_{asset_id}"
    webp_path = get_image_path(session_id=session_id, asset_id=asset_id, base_dir=session_base_dir)
    webp_path.parent.mkdir(parents=True, exist_ok=True)
    webp_path.write_bytes(webp_data)

    asset = Asset(
        id=asset_id,
        file=f"images/{asset_id}.webp",
        width=width,
        height=height,
        mime="image/webp",
        original_name=original_filename,
        size=len(webp_data),
    )
    item = Item(
        id=item_id,
        assetId=asset_id,
        layoutPreference=derive_layout_preference(asset),
    )

    return asset, item


def import_long_screen_bytes_to_session(
    file_data: bytes,
    session_id: str,
    original_filename: str | None = None,
    quality: int = 75,
    min_size: int = 1000,
    session_base_dir: str | Path | None = None,
) -> list[tuple[Asset, Item]]:
    quality, min_size = _validate_import_options(quality, min_size)

    try:
        with Image.open(BytesIO(file_data)) as image:
            if image.mode not in {"RGB", "RGBA", "LA", "L"}:
                image = image.convert("RGB")

            long_screenshot_segments = _split_long_screenshot(image)
            if not long_screenshot_segments:
                raise NotLongScreenshotError("此圖片不是長截圖")

            results: list[tuple[Asset, Item]] = []
            for segment_image in long_screenshot_segments:
                webp_data, width, height = _compact_image(
                    segment_image,
                    min_size=min_size,
                    quality=quality,
                )

                asset_id = str(uuid4())
                item_id = f"item_{asset_id}"
                webp_path = get_image_path(
                    session_id=session_id,
                    asset_id=asset_id,
                    base_dir=session_base_dir,
                )
                webp_path.parent.mkdir(parents=True, exist_ok=True)
                webp_path.write_bytes(webp_data)

                asset = Asset(
                    id=asset_id,
                    file=f"images/{asset_id}.webp",
                    width=width,
                    height=height,
                    mime="image/webp",
                    original_name=original_filename,
                    size=len(webp_data),
                )
                item = Item(
                    id=item_id,
                    assetId=asset_id,
                    layoutPreference=derive_layout_preference(asset),
                )
                results.append((asset, item))

            return results
    except NotLongScreenshotError:
        raise
    except UnidentifiedImageError as exc:
        raise ImageImportError("檔案不是可辨識的圖片格式") from exc
    except Exception as exc:
        raise ImageImportError(f"圖片處理失敗: {exc}") from exc


def append_default_layout_item_order(
    project: Any,
    item_ids: list[str],
) -> None:
    if not item_ids:
        return

    if not getattr(project, "layouts", None):
        return

    default_layout = next((layout for layout in project.layouts if layout.id == "layout_word_default"), None)
    if default_layout is None:
        return

    default_layout.item_order.extend(item_ids)
