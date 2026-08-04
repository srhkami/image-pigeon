from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path
import logging
import os
import platform
import re
import sys
from typing import Any, Iterator
from uuid import UUID, uuid4

LOGGER_NAME = "image_pigeon"
LOG_MAX_BYTES = 2 * 1024 * 1024
LOG_BACKUP_COUNT = 3
UUID_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
_OPERATION_ID: ContextVar[str | None] = ContextVar("image_pigeon_operation_id", default=None)
_FILE_HANDLER_MARKER = "_image_pigeon_file"
_CONSOLE_HANDLER_MARKER = "_image_pigeon_console"
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_DATA_URL_RE = re.compile(r"data:[^\s,]{1,128};base64,[A-Za-z0-9+/=_-]+", re.IGNORECASE)
_ABSOLUTE_PATH_RE = re.compile(r"(?:[A-Za-z]:[\\/]|/)(?:[^\s'\"]+/)+[^\s'\"]+")

_ALLOWED_FIELDS = {
    "event", "operation_id", "stage", "method", "route", "status", "duration_ms",
    "item_count", "success_count", "failure_count", "asset_count", "order_count",
    "page_count", "slot_count", "segment_count", "image_width", "image_height",
    "input_bytes", "output_bytes", "quality", "min_size", "project_schema",
    "project_version", "error_type", "detail_code", "file_ext", "platform",
    "app_version", "mode",
}
_COUNT_FIELDS = {
    "item_count", "success_count", "failure_count", "asset_count", "order_count",
    "page_count", "slot_count", "segment_count", "image_width", "image_height",
    "input_bytes", "output_bytes", "project_version",
}
_CODE_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.-]{0,63}$")
_EXTENSION_RE = re.compile(r"^\.[a-z0-9]{1,15}$")
_ROUTE_RE = re.compile(r"^(?:/[A-Za-z0-9_./{}-]{1,96}|pywebview\.api)$")


def get_log_dir() -> Path:
    """傳回不依賴目前工作目錄的使用者記錄目錄。"""
    home = Path.home()
    if sys.platform == "win32":
        base = Path(os.environ.get("LOCALAPPDATA", home / "AppData" / "Local"))
        return base / "image-pigeon" / "logs"
    if sys.platform == "darwin":
        return home / "Library" / "Logs" / "image-pigeon"
    base = Path(os.environ.get("XDG_STATE_HOME", home / ".local" / "state"))
    return base / "image-pigeon" / "logs"


def request_operation_id(candidate: str | None = None) -> str:
    if candidate and re.fullmatch(UUID_PATTERN, candidate):
        return candidate
    return str(uuid4())


def current_operation_id() -> str | None:
    return _OPERATION_ID.get()


@contextmanager
def operation_context(operation_id: str | None = None) -> Iterator[str]:
    value = request_operation_id(operation_id)
    token = _OPERATION_ID.set(value)
    try:
        yield value
    finally:
        _OPERATION_ID.reset(token)


def _escape(value: object) -> str:
    text = str(value)
    text = _DATA_URL_RE.sub("<binary:redacted>", text)
    text = _ABSOLUTE_PATH_RE.sub("<user-path>", text)
    text = text.replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t")
    text = _CONTROL_RE.sub(lambda match: f"\\x{ord(match.group(0)):02x}", text)
    return text[:4096] + ("…[truncated]" if len(text) > 4096 else "")


def _valid_diagnostic(fields: dict[str, Any]) -> dict[str, str]:
    result: dict[str, str] = {}
    for name, value in fields.items():
        if name not in _ALLOWED_FIELDS:
            continue
        if name == "operation_id":
            if isinstance(value, str) and re.fullmatch(UUID_PATTERN, value):
                result[name] = value
            continue
        if name in _COUNT_FIELDS:
            if isinstance(value, int) and 0 <= value <= 1_000_000_000:
                result[name] = str(value)
            continue
        if name == "status":
            if isinstance(value, int) and 100 <= value <= 599:
                result[name] = str(value)
            continue
        if name == "duration_ms":
            if isinstance(value, int) and 0 <= value <= 86_400_000:
                result[name] = str(value)
            continue
        if name == "quality":
            if isinstance(value, int) and 1 <= value <= 100:
                result[name] = str(value)
            continue
        if name == "min_size":
            if isinstance(value, int) and 1 <= value <= 100_000:
                result[name] = str(value)
            continue
        if name == "file_ext":
            if isinstance(value, str) and _EXTENSION_RE.fullmatch(value):
                result[name] = value
            continue
        if name == "project_schema":
            if value == "image-pigeon.project":
                result[name] = value
            continue
        if name == "route":
            if isinstance(value, str) and _ROUTE_RE.fullmatch(value):
                result[name] = value
            continue
        if isinstance(value, str) and _CODE_RE.fullmatch(value):
            result[name] = value
    return result


class _SafeFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        fields = _valid_diagnostic(getattr(record, "diagnostic", {}))
        fields.setdefault("operation_id", current_operation_id() or "-")
        message = _escape(record.getMessage())
        prefix = super().formatTime(record, self.datefmt)
        serialized = " ".join(f"{key}={value}" for key, value in sorted(fields.items()))
        line = f"{prefix} level={record.levelname} module={record.module} {serialized} message={message}".strip()
        return line[:4096] + ("…[truncated]" if len(line) > 4096 else "")


def _add_console_handler(logger: logging.Logger) -> None:
    if any(getattr(handler, _CONSOLE_HANDLER_MARKER, False) for handler in logger.handlers):
        return
    handler = logging.StreamHandler()
    setattr(handler, _CONSOLE_HANDLER_MARKER, True)
    handler.setLevel(logging.INFO)
    handler.setFormatter(_SafeFormatter())
    logger.addHandler(handler)


def configure_logging(log_dir: str | Path | None = None) -> logging.Logger:
    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    _add_console_handler(logger)
    if any(getattr(handler, _FILE_HANDLER_MARKER, False) for handler in logger.handlers):
        return logger
    try:
        destination = Path(log_dir) if log_dir is not None else get_log_dir()
        destination.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(destination / "debug.log", encoding="utf-8", maxBytes=LOG_MAX_BYTES, backupCount=LOG_BACKUP_COUNT)
        setattr(handler, _FILE_HANDLER_MARKER, True)
        handler.setLevel(logging.DEBUG)
        handler.setFormatter(_SafeFormatter())
        logger.addHandler(handler)
    except OSError:
        logger.warning("persistent_log_unavailable", extra={"diagnostic": {"event": "logging.file_unavailable", "platform": platform.system().lower()}})
    return logger


def log_event(level: int, event: str, **fields: Any) -> None:
    diagnostic = {"event": event, **fields}
    if current_operation_id() and "operation_id" not in diagnostic:
        diagnostic["operation_id"] = current_operation_id()
    configure_logging().log(level, "diagnostic_event", extra={"diagnostic": diagnostic})


def log() -> logging.Logger:
    return configure_logging()


def reset_logging_for_tests() -> None:
    logger = logging.getLogger(LOGGER_NAME)
    for handler in list(logger.handlers):
        logger.removeHandler(handler)
        handler.close()
    _OPERATION_ID.set(None)
