from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from .image_service import (
    ImageImportError,
    append_default_layout_item_order,
    import_long_screen_bytes_to_session,
    import_image_bytes_to_session,
    NotLongScreenshotError,
)
from .project_service import ProjectServiceError, open_project_folder, save_project_folder
from .models import ProjectV2
from .session_store import create_session, get_image_path, read_session, write_session


class ProjectSaveRequest(BaseModel):
    session_id: str = Field(alias="sessionId")
    project: ProjectV2
    target_path: str = Field(alias="targetPath")

    model_config = ConfigDict(populate_by_name=True)


class ProjectOpenRequest(BaseModel):
    project_path: str = Field(alias="projectPath")

    model_config = ConfigDict(populate_by_name=True)


def create_app(
    static_dir: str | Path | None = None,
    *,
    session_base_dir: str | Path | None = None,
) -> FastAPI:
    app = FastAPI(title="image-pigeon")

    @app.get("/api/health")
    def health() -> dict[str, Any]:
        return {"status": 200, "message": "ok", "data": {"app": "image-pigeon"}}

    @app.post("/api/images/import")
    async def import_images(
        files: list[UploadFile] = File(...),
        session_id: str | None = Form(None),
        quality: int = Form(75),
        min_size: int = Form(1000),
    ) -> dict[str, Any]:
        if not files:
            raise HTTPException(status_code=400, detail="未上傳圖片檔案")

        target_session_id = session_id
        new_created_at = None

        if target_session_id:
            try:
                session_payload = read_session(target_session_id, base_dir=session_base_dir)
                project = session_payload["project"]
                new_created_at = session_payload.get("createdAt")
            except FileNotFoundError:
                project = ProjectV2()
                target_session_id = create_session(
                    base_dir=session_base_dir,
                    session_id=target_session_id,
                    project=project,
                )
        else:
            project = ProjectV2()
            target_session_id = create_session(base_dir=session_base_dir, project=project)

        created_assets: list[Any] = []
        created_items: list[Any] = []
        append_item_order: list[str] = []
        skipped: list[str] = []
        errors: list[dict[str, str]] = []

        for upload_file in files:
            raw_bytes = await upload_file.read()
            try:
                asset, item = import_image_bytes_to_session(
                    raw_bytes,
                    session_id=target_session_id,
                    original_filename=upload_file.filename,
                    quality=quality,
                    min_size=min_size,
                    session_base_dir=session_base_dir,
                )
                created_assets.append(asset)
                created_items.append(item)
                append_item_order.append(item.id)
            except ImageImportError as exc:
                filename = upload_file.filename or "unknown"
                skipped.append(filename)
                errors.append({"filename": filename, "message": str(exc)})
            except Exception as exc:
                filename = upload_file.filename or "unknown"
                skipped.append(filename)
                errors.append({"filename": filename, "message": f"處理失敗: {exc}"})

        if not created_assets:
            return JSONResponse(
                status_code=400,
                content={
                    "status": 400,
                    "message": "無有效圖片可匯入",
                    "data": {
                        "sessionId": target_session_id,
                        "assets": [],
                        "items": [],
                        "layoutPatch": {"appendItemOrder": []},
                        "skipped": skipped,
                        "errors": errors,
                    },
                },
            )

        project.assets.extend(created_assets)
        project.items.extend(created_items)
        append_default_layout_item_order(project, append_item_order)

        write_session(
            session_id=target_session_id,
            project=project,
            base_dir=session_base_dir,
            created_at=new_created_at,
            updated_at=datetime.now(UTC).isoformat(),
        )

        response_data: dict[str, Any] = {
            "sessionId": target_session_id,
            "assets": [asset.model_dump(by_alias=True) for asset in created_assets],
            "items": [item.model_dump(by_alias=True) for item in created_items],
            "layoutPatch": {
                "appendItemOrder": append_item_order,
            },
        }
        if skipped:
            response_data["skipped"] = skipped
        if errors:
            response_data["errors"] = errors

        return {"status": 200, "message": "新增成功", "data": response_data}

    @app.post("/api/images/import-long-screen")
    async def import_long_screen_images(
        file: UploadFile = File(...),
        session_id: str | None = Form(None),
        quality: int = Form(75),
        min_size: int = Form(1000),
    ) -> dict[str, Any]:
        target_session_id = session_id
        new_created_at = None

        if target_session_id:
            try:
                session_payload = read_session(target_session_id, base_dir=session_base_dir)
                project = session_payload["project"]
                new_created_at = session_payload.get("createdAt")
            except FileNotFoundError:
                project = ProjectV2()
                target_session_id = create_session(
                    base_dir=session_base_dir,
                    session_id=target_session_id,
                    project=project,
                )
        else:
            project = ProjectV2()
            target_session_id = create_session(base_dir=session_base_dir, project=project)

        raw_bytes = await file.read()
        try:
            results = import_long_screen_bytes_to_session(
                raw_bytes,
                session_id=target_session_id,
                original_filename=file.filename,
                quality=quality,
                min_size=min_size,
                session_base_dir=session_base_dir,
            )
        except NotLongScreenshotError as exc:
            return JSONResponse(
                status_code=400,
                content={
                    "status": 400,
                    "message": "此圖片不是長截圖",
                    "detail": str(exc),
                    "data": {
                        "sessionId": target_session_id,
                        "assets": [],
                        "items": [],
                        "layoutPatch": {"appendItemOrder": []},
                    },
                },
            )
        except ImageImportError as exc:
            return JSONResponse(
                status_code=400,
                content={
                    "status": 400,
                    "message": "圖片處理失敗",
                    "detail": str(exc),
                    "data": {
                        "sessionId": target_session_id,
                        "assets": [],
                        "items": [],
                        "layoutPatch": {"appendItemOrder": []},
                    },
                },
            )

        created_assets = [asset for asset, _ in results]
        created_items = [item for _, item in results]
        append_item_order = [item.id for item in created_items]

        if not created_assets:
            return JSONResponse(
                status_code=400,
                content={
                    "status": 400,
                    "message": "無有效圖片可匯入",
                    "data": {
                        "sessionId": target_session_id,
                        "assets": [],
                        "items": [],
                        "layoutPatch": {"appendItemOrder": []},
                    },
                },
            )

        project.assets.extend(created_assets)
        project.items.extend(created_items)
        append_default_layout_item_order(project, append_item_order)

        write_session(
            session_id=target_session_id,
            project=project,
            base_dir=session_base_dir,
            created_at=new_created_at,
            updated_at=datetime.now(UTC).isoformat(),
        )

        return {
            "status": 200,
            "message": "新增成功",
            "data": {
                "sessionId": target_session_id,
                "assets": [asset.model_dump(by_alias=True) for asset in created_assets],
                "items": [item.model_dump(by_alias=True) for item in created_items],
                "layoutPatch": {"appendItemOrder": append_item_order},
                "segments": len(created_assets),
            },
        }

    @app.get("/api/sessions/{session_id}/assets/{asset_id}/image")
    def get_session_image(session_id: str, asset_id: str) -> FileResponse:
        try:
            session_payload = read_session(session_id, base_dir=session_base_dir)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Session 不存在") from exc
        project = session_payload["project"]
        if not any(asset.id == asset_id for asset in project.assets):
            raise HTTPException(status_code=404, detail="Asset 不存在")

        image_path = get_image_path(session_id, asset_id, base_dir=session_base_dir)
        if not image_path.exists():
            raise HTTPException(status_code=404, detail="圖片不存在")

        return FileResponse(image_path, media_type="image/webp")

    def _project_service_error_response(exc: ProjectServiceError) -> JSONResponse:
        status = exc.http_status()
        return JSONResponse(
            status_code=status,
            content={"status": status, "message": str(exc), "data": {}},
        )

    @app.post("/api/project/save")
    def save_project(payload: ProjectSaveRequest) -> dict[str, Any]:
        try:
            saved_project = save_project_folder(
                session_id=payload.session_id,
                project_payload=payload.project,
                target_path=payload.target_path,
                session_base_dir=session_base_dir,
            )
        except ProjectServiceError as exc:
            return _project_service_error_response(exc)

        absolute_target_path = Path(payload.target_path).resolve()
        return {
            "status": 200,
            "message": "儲存成功",
            "data": {
                "path": str(absolute_target_path),
                "project": saved_project.model_dump(by_alias=True),
            },
        }

    @app.post("/api/project/open")
    def open_project(payload: ProjectOpenRequest) -> dict[str, Any]:
        try:
            session_id, project = open_project_folder(
                payload.project_path,
                session_base_dir=session_base_dir,
            )
        except ProjectServiceError as exc:
            return _project_service_error_response(exc)

        return {
            "status": 200,
            "message": "開啟成功",
            "data": {
                "sessionId": session_id,
                "project": project.model_dump(by_alias=True),
            },
        }

    resolved_static_dir = Path(static_dir).resolve() if static_dir else None
    if resolved_static_dir and resolved_static_dir.exists():
        assets_dir = resolved_static_dir / "assets"
        if assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/")
        def serve_index() -> FileResponse:
            return FileResponse(resolved_static_dir / "index.html")

        @app.get("/{path:path}")
        def serve_react_app(path: str) -> FileResponse:
            target = resolved_static_dir / path
            if target.is_file():
                return FileResponse(target)
            index = resolved_static_dir / "index.html"
            if index.exists():
                return FileResponse(index)
            raise HTTPException(status_code=404, detail="Not found")

    return app
