---
id: findings-image-pigeon-fastapi-session-project-format-2026-06-30
type: findings
status: current
canonical: false
created_at: 2026-06-30T16:47:00+08:00
project: image-pigeon
---

# Findings

## Codebase observations

- `pywebview-base/main.py` already demonstrates a FastAPI + uvicorn thread pattern.
- `pywebview-base/vite.config.ts` already has a `/api` proxy pattern.
- `image-pigeon/py/main.py` currently exposes an `Api` object via `js_api=api`.
- `image-pigeon/src` currently calls `window.pywebview.api.*` for image import/export operations.
- `image-pigeon/src/globak.d.ts` declares pywebview API types for upload/crop/save/select_path.
- `image-pigeon/pyproject.toml` currently lacks FastAPI/uvicorn dependencies.
- `image-pigeon/package.json` already includes axios.

## Current main js_api calls to replace or shrink

Replace with FastAPI:

- `upload_image`
- `crop_image`
- `save_docx`
- `save_images`
- `save_json` is removed from mainline and replaced by save project.

Keep pywebview/native bridge:

- `select_path` or equivalent file/folder picker.
- pywebview window startup/storage behavior.

## Data model findings

- Current frontend `CustomImage` stores base64/preview/width/height/rotation.
- New model should split asset/item/layout:
  - asset = compressed WebP file reference
  - item = usage instance with remark/rotation/crop
  - layout = order or future page layout

## Known cleanup issue

- `py/crop_image.py` currently writes JPEG bytes but returns a `data:image/png;base64` header. New format should avoid this mismatch by storing actual WebP files with correct mime metadata.

## Formal plan

- `../../docs/plans/2026-06-30-1647-fastapi-session-project-format.md`
