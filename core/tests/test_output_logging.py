import base64
import logging
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import MagicMock, patch
from uuid import UUID

from PIL import Image

import main
from core.handle_log import configure_logging, reset_logging_for_tests


OPEN_WARNING_MESSAGE = "儲存成功，但無法自動開啟檔案"


def output_request(path: str, *, title: str = "私人標題", remark: str = "私人備註") -> dict:
    encoded = base64.b64encode(b"private-image-bytes").decode()
    return {
        "title": title,
        "path": path,
        "images": [{
            "id": "image-1",
            "base64": f"data:image/png;base64,{encoded}",
            "remark": remark,
            "width": 1,
            "height": 1,
            "rotation": 0,
        }],
        "align_vertical": "top",
        "font_size": 12,
        "mode": 1,
        "is_remark_mode": False,
    }


class OutputLoggingTest(unittest.TestCase):
    def setUp(self):
        reset_logging_for_tests()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        configure_logging(self.temp_dir.name)

    def tearDown(self):
        reset_logging_for_tests()

    def assert_operation_events(self, event_calls, expected_events):
        self.assertEqual([call.args[1] for call in event_calls], expected_events)
        operation_ids = [call.kwargs["operation_id"] for call in event_calls]
        self.assertEqual(len(set(operation_ids)), 1)
        self.assertEqual(str(UUID(operation_ids[0])), operation_ids[0])

    def assert_no_private_output_values(self, event_calls, request):
        serialized = repr(event_calls)
        self.assertNotIn(request["path"], serialized)
        self.assertNotIn(request["title"], serialized)
        self.assertNotIn(request["images"][0]["remark"], serialized)
        self.assertNotIn(request["images"][0]["base64"], serialized)

    def test_word_save_success_emits_correlated_safe_events(self):
        request = output_request("/private/person/word-output.docx")
        document = MagicMock()

        with (
            patch("main.creat_docx", return_value=document),
            patch("main.add_header", return_value=document),
            patch("main.open_file"),
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_docx(request)

        self.assertEqual(response, {"status": 200, "message": "儲存成功", "data": None})
        document.save.assert_called_once_with(request["path"])
        self.assert_operation_events(
            log_event.call_args_list,
            ["output.word_started", "output.word_completed"],
        )
        self.assertEqual(log_event.call_args_list[0].kwargs["page_count"], 0)
        self.assertEqual(log_event.call_args_list[0].kwargs["slot_count"], 0)
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_word_write_failure_returns_non_200_and_logs_failed_stage(self):
        request = output_request("/private/person/write-failure.docx")
        document = MagicMock()
        document.save.side_effect = OSError("private write failure")

        with (
            patch("main.creat_docx", return_value=document),
            patch("main.add_header", return_value=document),
            patch("main.open_file") as open_file,
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_docx(request)

        self.assertNotEqual(response["status"], 200)
        open_file.assert_not_called()
        self.assertEqual(log_event.call_args_list[-1].args[1], "output.word_failed")
        self.assertEqual(log_event.call_args_list[-1].kwargs["stage"], "write")
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_word_open_failure_returns_200_fixed_warning_and_logs_warning(self):
        request = output_request("/private/person/open-failure.docx")
        document = MagicMock()

        with (
            patch("main.creat_docx", return_value=document),
            patch("main.add_header", return_value=document),
            patch("main.open_file", side_effect=OSError("private open failure")),
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_docx(request)

        self.assertEqual(response, {"status": 200, "message": OPEN_WARNING_MESSAGE, "data": None})
        document.save.assert_called_once_with(request["path"])
        self.assertEqual(log_event.call_args_list[-1].args, (logging.WARNING, "output.word_open_failed"))
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_images_write_failure_returns_non_200_and_does_not_open_folder(self):
        request = output_request("/private/person/images")

        with (
            patch("main.save", side_effect=OSError("private image write failure")),
            patch("main.open_folder") as open_folder,
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_images(request)

        self.assertNotEqual(response["status"], 200)
        open_folder.assert_not_called()
        self.assertEqual(log_event.call_args_list[-1].args[1], "output.images_failed")
        self.assertEqual(log_event.call_args_list[-1].kwargs["stage"], "write")
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_images_open_failure_returns_200_fixed_warning_after_write(self):
        request = output_request("/private/person/images")

        with (
            patch("main.save"),
            patch("main.open_folder", side_effect=OSError("private folder failure")),
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_images(request)

        self.assertEqual(response, {"status": 200, "message": OPEN_WARNING_MESSAGE, "data": None})
        self.assertEqual(log_event.call_args_list[-1].args, (logging.WARNING, "output.images_open_failed"))
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_json_write_success_then_open_emits_correlated_safe_events(self):
        with tempfile.TemporaryDirectory() as output_dir:
            request = output_request(str(Path(output_dir) / "private-output.json"))
            with (
                patch("main.open_file"),
                patch("main.log_event") as log_event,
            ):
                response = main.Api().save_json(request)

            self.assertEqual(response, {"status": 200, "message": "儲存成功", "data": None})
            self.assertTrue(Path(request["path"]).exists())
            self.assert_operation_events(
                log_event.call_args_list,
                ["output.json_started", "output.json_completed"],
            )
            self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_json_output_log_redacts_private_payload_values(self):
        with tempfile.TemporaryDirectory() as output_dir:
            request = output_request(str(Path(output_dir) / "private-output.json"))
            with patch("main.open_file"):
                response = main.Api().save_json(request)

            self.assertEqual(response["status"], 200)
            log_text = (Path(self.temp_dir.name) / "debug.log").read_text(encoding="utf-8")
            self.assertNotIn(request["path"], log_text)
            self.assertNotIn(request["title"], log_text)
            self.assertNotIn(request["images"][0]["remark"], log_text)
            self.assertNotIn(request["images"][0]["base64"], log_text)

    def test_json_write_failure_returns_non_200_and_does_not_open(self):
        request = output_request("/private/person/write-failure.json")

        with (
            patch("builtins.open", side_effect=OSError("private JSON write failure")),
            patch("main.open_file") as open_file,
            patch("main.log_event") as log_event,
        ):
            response = main.Api().save_json(request)

        self.assertNotEqual(response["status"], 200)
        open_file.assert_not_called()
        self.assertEqual(log_event.call_args_list[-1].args[1], "output.json_failed")
        self.assertEqual(log_event.call_args_list[-1].kwargs["stage"], "write")
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_json_open_failure_returns_200_fixed_warning(self):
        with tempfile.TemporaryDirectory() as output_dir:
            request = output_request(str(Path(output_dir) / "private-open-failure.json"))
            with (
                patch("main.open_file", side_effect=OSError("private open failure")),
                patch("main.log_event") as log_event,
            ):
                response = main.Api().save_json(request)

        self.assertEqual(response, {"status": 200, "message": OPEN_WARNING_MESSAGE, "data": None})
        self.assertEqual(log_event.call_args_list[-1].args, (logging.WARNING, "output.json_open_failed"))
        self.assert_no_private_output_values(log_event.call_args_list, request)

    def test_save_images_writes_files_without_opening_folder(self):
        from core.save_images import SaveAsImages, save

        with tempfile.TemporaryDirectory() as output_dir:
            image_path = Path(output_dir)
            image = Image.new("RGB", (1, 1), "white")
            image_bytes = BytesIO()
            image.save(image_bytes, format="PNG")
            encoded = base64.b64encode(image_bytes.getvalue()).decode()
            request = output_request(str(image_path))
            request["images"][0]["base64"] = f"data:image/png;base64,{encoded}"

            with (
                patch("core.save_images.open_folder") as open_folder,
                patch.object(main.webview, "windows", [MagicMock()]),
            ):
                save(SaveAsImages(request))

            self.assertTrue((image_path / "私人標題_1.jpg").exists())
            open_folder.assert_not_called()


if __name__ == "__main__":
    unittest.main()
