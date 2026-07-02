import json
import sys
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models import ProjectV2
from app.session_store import (
    clean_expired_sessions,
    create_session,
    cleanup_current_session,
    get_image_path,
    get_session_dir,
    read_session,
    write_session,
)


class SessionStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.workspace = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.workspace.name)

    def tearDown(self) -> None:
        self.workspace.cleanup()

    def test_create_session_creates_session_dir_and_session_json(self):
        session_id = create_session(base_dir=self.base_dir)

        session_dir = get_session_dir(session_id, base_dir=self.base_dir)
        self.assertTrue((session_dir / "images").exists())
        self.assertTrue((session_dir / "session.json").exists())

    def test_write_and_read_session_roundtrip(self):
        session_id = create_session(base_dir=self.base_dir)
        project = ProjectV2()
        project.document.title = "Roundtrip"
        write_session(
            session_id=session_id,
            project=project,
            base_dir=self.base_dir,
            created_at="2026-01-01T00:00:00+00:00",
            updated_at="2026-01-01T01:00:00+00:00",
            metadata={"source": "unit-test"},
        )

        loaded = read_session(session_id, base_dir=self.base_dir)

        self.assertEqual(loaded["sessionId"], session_id)
        self.assertEqual(loaded["createdAt"], "2026-01-01T00:00:00+00:00")
        self.assertEqual(loaded["updatedAt"], "2026-01-01T01:00:00+00:00")
        self.assertEqual(loaded["runtime"]["schema"], "image-pigeon.project")
        self.assertEqual(loaded["runtime"]["version"], 2)
        self.assertEqual(loaded["project"].document.title, "Roundtrip")
        self.assertEqual(loaded["metadata"]["source"], "unit-test")

    def test_get_image_path_shape(self):
        asset_id = "c7e8f4a8-2e4c-4d3f-a4b1-7c4f0f6e7b90"
        path = get_image_path("session-a", asset_id, base_dir=self.base_dir)

        expected = self.base_dir / "web_cache" / "temp" / "sessions" / "session-a" / "images" / f"{asset_id}.webp"
        self.assertEqual(path, expected)

    def test_clean_expired_sessions_removes_only_old(self):
        fresh_id = create_session(base_dir=self.base_dir)
        expired_id = create_session(base_dir=self.base_dir)

        fresh_session = get_session_dir(fresh_id, base_dir=self.base_dir) / "session.json"
        expired_session = get_session_dir(expired_id, base_dir=self.base_dir) / "session.json"

        fresh_payload = json.loads(fresh_session.read_text(encoding="utf-8"))
        expired_payload = json.loads(expired_session.read_text(encoding="utf-8"))

        now = datetime.now(UTC)
        fresh_payload["updatedAt"] = (now - timedelta(hours=1)).isoformat()
        expired_payload["updatedAt"] = (now - timedelta(hours=25)).isoformat()

        fresh_session.write_text(json.dumps(fresh_payload, ensure_ascii=False, indent=2), encoding="utf-8")
        expired_session.write_text(json.dumps(expired_payload, ensure_ascii=False, indent=2), encoding="utf-8")

        removed = clean_expired_sessions(hours=24, base_dir=self.base_dir)

        self.assertNotIn(fresh_id, removed)
        self.assertIn(expired_id, removed)
        self.assertTrue((get_session_dir(fresh_id, base_dir=self.base_dir)).exists())
        self.assertFalse((get_session_dir(expired_id, base_dir=self.base_dir)).exists())

    def test_cleanup_current_session(self):
        session_id = create_session(base_dir=self.base_dir)
        session_dir = get_session_dir(session_id, base_dir=self.base_dir)

        removed = cleanup_current_session(session_id, base_dir=self.base_dir)

        self.assertTrue(removed)
        self.assertFalse(session_dir.exists())
