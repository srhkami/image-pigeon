from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
import json
import shutil
from uuid import uuid4

from .models import ProjectV2


def get_session_dir(session_id: str, base_dir: str | Path | None = None) -> Path:
    return _get_sessions_root(base_dir) / session_id


def get_image_path(
    session_id: str,
    asset_id: str,
    base_dir: str | Path | None = None,
) -> Path:
    return get_session_dir(session_id, base_dir=base_dir) / "images" / f"{asset_id}.webp"


def create_session(
    base_dir: str | Path | None = None,
    session_id: str | None = None,
    project: ProjectV2 | None = None,
) -> str:
    actual_session_id = session_id or str(uuid4())
    session_dir = get_session_dir(actual_session_id, base_dir=base_dir)
    images_dir = session_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(UTC).isoformat()
    write_session(
        session_id=actual_session_id,
        project=project or ProjectV2(),
        base_dir=base_dir,
        created_at=now,
        updated_at=now,
    )

    return actual_session_id


def write_session(
    session_id: str,
    project: ProjectV2,
    base_dir: str | Path | None = None,
    *,
    created_at: str | None = None,
    updated_at: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> Path:
    now = datetime.now(UTC).isoformat()
    session_dir = get_session_dir(session_id, base_dir=base_dir)
    session_dir.mkdir(parents=True, exist_ok=True)

    payload: dict[str, Any] = {
        "sessionId": session_id,
        "project": project.model_dump(by_alias=True),
        "createdAt": created_at or now,
        "updatedAt": updated_at or now,
        "runtime": {
            "schema": project.schema,
            "version": project.version,
        },
    }
    if metadata:
        payload["metadata"] = metadata

    session_json_path = session_dir / "session.json"
    session_json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return session_json_path


def read_session(
    session_id: str,
    base_dir: str | Path | None = None,
) -> dict[str, Any]:
    path = get_session_dir(session_id, base_dir=base_dir) / "session.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    payload = dict(raw)
    payload["project"] = ProjectV2.model_validate(raw["project"])
    return payload


def clean_expired_sessions(
    hours: int = 24,
    base_dir: str | Path | None = None,
) -> list[str]:
    removed: list[str] = []
    sessions_root = _get_sessions_root(base_dir)
    if not sessions_root.exists():
        return removed

    now = datetime.now(UTC)
    for session_dir in sessions_root.iterdir():
        if not session_dir.is_dir():
            continue
        session_json = session_dir / "session.json"
        if not session_json.exists():
            continue

        try:
            raw = json.loads(session_json.read_text(encoding="utf-8"))
            updated_at = datetime.fromisoformat(raw["updatedAt"])
        except Exception:
            continue

        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=UTC)
        is_expired = now - updated_at > timedelta(hours=hours)
        if not is_expired:
            continue

        if cleanup_current_session(session_dir.name, base_dir=base_dir):
            removed.append(session_dir.name)

    return removed


def cleanup_current_session(session_id: str, base_dir: str | Path | None = None) -> bool:
    session_dir = get_session_dir(session_id, base_dir=base_dir)
    if not session_dir.exists():
        return False
    shutil.rmtree(session_dir)
    return True


def _get_sessions_root(base_dir: str | Path | None = None) -> Path:
    base = Path(base_dir) if base_dir is not None else Path.cwd()
    return base / "web_cache" / "temp" / "sessions"
