import logging
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from core import handle_log


class HandleLogTest(unittest.TestCase):
    def setUp(self):
        handle_log.reset_logging_for_tests()
        self.addCleanup(handle_log.reset_logging_for_tests)

    def test_configure_logging_writes_redacted_single_line_to_injected_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            logger = handle_log.configure_logging(log_dir=temp_dir)
            logger.info(
                "診斷事件",
                extra={
                    "diagnostic": {
                        "event": "image_import.completed",
                        "operation_id": "123e4567-e89b-12d3-a456-426614174000",
                        "stage": "completed",
                        "item_count": 1,
                        "detail_code": "<PRIVATE_NOTE>\n<data:image/png;base64,PRIVATE_BASE64>",
                    }
                },
            )
            for handler in logger.handlers:
                handler.flush()

            contents = (Path(temp_dir) / "debug.log").read_text(encoding="utf-8")

        self.assertIn("event=image_import.completed", contents)
        self.assertIn("operation_id=123e4567-e89b-12d3-a456-426614174000", contents)
        self.assertNotIn("PRIVATE_NOTE", contents)
        self.assertNotIn("PRIVATE_BASE64", contents)
        self.assertNotIn("\n<data", contents)

    def test_configure_logging_is_idempotent_and_uses_rotation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            first = handle_log.configure_logging(log_dir=temp_dir)
            second = handle_log.configure_logging(log_dir=temp_dir)

            self.assertIs(first, second)
            file_handlers = [handler for handler in first.handlers if isinstance(handler, logging.Handler) and getattr(handler, "_image_pigeon_file", False)]

        self.assertEqual(len(file_handlers), 1)
        self.assertEqual(file_handlers[0].maxBytes, handle_log.LOG_MAX_BYTES)
        self.assertEqual(file_handlers[0].backupCount, handle_log.LOG_BACKUP_COUNT)

    def test_invalid_external_operation_id_is_replaced_and_not_echoed(self):
        invalid = "PRIVATE\nHEADER"
        operation_id = handle_log.request_operation_id(invalid)

        self.assertNotEqual(operation_id, invalid)
        self.assertRegex(operation_id, handle_log.UUID_PATTERN)

    def test_file_handler_failure_keeps_console_logger_available(self):
        with patch("core.handle_log.RotatingFileHandler", side_effect=OSError("cannot create")):
            logger = handle_log.configure_logging(log_dir="/not-used")

        self.assertTrue(logger.handlers)
        self.assertFalse(any(getattr(handler, "_image_pigeon_file", False) for handler in logger.handlers))


if __name__ == "__main__":
    unittest.main()
