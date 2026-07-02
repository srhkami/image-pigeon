from __future__ import annotations

from pathlib import Path
import json
import shutil

from .models import ProjectV2
from .session_store import create_session, get_image_path


class ProjectServiceError(RuntimeError):
    status_code: int = 400

    def http_status(self) -> int:
        return self.status_code


class ProjectNotFoundError(ProjectServiceError):
    status_code = 404


class ProjectAssetError(ProjectServiceError):
    pass


def _resolve_project_root(project_path: str | Path) -> Path:
    root = Path(project_path)
    if not root.exists():
        return root.resolve()
    return root.resolve()


def _ensure_safe_project_file_path(root: Path, asset_file: str) -> Path:
    if Path(asset_file).is_absolute():
        raise ProjectAssetError(f"資源路徑不安全：{asset_file}")

    candidate = (root / asset_file).resolve()
    root_resolved = root.resolve()
    if not candidate.is_relative_to(root_resolved):
        raise ProjectAssetError(f"資源路徑不安全：{asset_file}")
    return candidate


def _validate_project_payload(project_payload: object) -> ProjectV2:
    try:
        return ProjectV2.model_validate(project_payload)
    except Exception as exc:
        raise ProjectServiceError(f"project 格式不合法: {exc}") from exc


def _ensure_session_asset_files(
    session_id: str,
    assets: list,
    *,
    base_dir: str | Path | None = None,
) -> list[tuple]:
    pairs: list[tuple] = []
    for asset in assets:
        source_path = get_image_path(session_id, asset.id, base_dir=base_dir)
        if not source_path.exists():
            raise ProjectAssetError(f"缺少 session 圖片檔案: {asset.file}")
        pairs.append((asset, source_path))
    return pairs


def _ensure_save_asset_files(
    session_id: str,
    target_root: Path,
    assets: list,
    *,
    base_dir: str | Path | None = None,
) -> list[tuple]:
    pairs: list[tuple] = []
    for asset, source_path in _ensure_session_asset_files(session_id, assets, base_dir=base_dir):
        dest_path = _ensure_safe_project_file_path(target_root, asset.file)
        pairs.append((source_path, dest_path))
    return pairs


def _ensure_project_asset_files(project_root: Path, assets: list) -> list[tuple]:
    pairs: list[tuple] = []
    for asset in assets:
        source_path = _ensure_safe_project_file_path(project_root, asset.file)
        if not source_path.exists():
            raise ProjectAssetError(f"缺少專案圖片檔案: {asset.file}")
        pairs.append((asset, source_path))
    return pairs


def save_project_folder(
    session_id: str,
    project_payload: object,
    target_path: str | Path,
    *,
    session_base_dir: str | Path | None = None,
) -> ProjectV2:
    project = _validate_project_payload(project_payload)

    target_root = _resolve_project_root(target_path)
    if target_root.exists() and not target_root.is_dir():
        raise ProjectAssetError("目標路徑不是資料夾")

    asset_file_pairs = _ensure_save_asset_files(
        session_id,
        target_root,
        project.assets,
        base_dir=session_base_dir,
    )

    target_root.mkdir(parents=True, exist_ok=True)

    images_root = target_root / "images"
    if images_root.exists():
        shutil.rmtree(images_root)
    images_root.mkdir(parents=True, exist_ok=True)

    for source_path, dest_path in asset_file_pairs:
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, dest_path)

    project_json_path = target_root / "project.json"
    project_json_path.write_text(
        json.dumps(project.model_dump(by_alias=True), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return project


def open_project_folder(
    project_path: str | Path,
    *,
    session_base_dir: str | Path | None = None,
) -> tuple[str, ProjectV2]:
    project_root = _resolve_project_root(project_path)
    if not project_root.exists():
        raise ProjectNotFoundError(f"專案資料夾不存在: {project_path}")

    project_json_path = project_root / "project.json"
    if not project_json_path.exists():
        raise ProjectNotFoundError("project.json 不存在")

    try:
        raw = json.loads(project_json_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ProjectServiceError(f"讀取 project.json 失敗: {exc}") from exc

    project = _validate_project_payload(raw)
    _ensure_project_asset_files(project_root, project.assets)

    session_id = create_session(base_dir=session_base_dir, project=project)

    for asset in project.assets:
        source_path = _ensure_safe_project_file_path(project_root, asset.file)
        target_path = get_image_path(session_id, asset.id, base_dir=session_base_dir)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, target_path)

    return session_id, project
