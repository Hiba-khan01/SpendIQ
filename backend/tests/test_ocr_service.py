import os
import sys
import logging
from unittest.mock import MagicMock, patch
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.services.ocr_service import OCRService, find_tesseract_binary


def test_find_tesseract_binary_path_found():
    with patch("shutil.which", return_value="/usr/bin/tesseract"), \
         patch("os.path.exists", return_value=True), \
         patch("platform.system", return_value="Linux"):
        bin_path = find_tesseract_binary()
        assert bin_path == "/usr/bin/tesseract"


def test_find_tesseract_binary_windows_candidate():
    with patch("shutil.which", return_value=None), \
         patch("platform.system", return_value="Windows"), \
         patch("os.path.exists") as mock_exists, \
         patch("os.path.isfile", return_value=True):
        def side_effect(path):
            return path == r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        mock_exists.side_effect = side_effect

        bin_path = find_tesseract_binary()
        assert bin_path == r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def test_find_tesseract_binary_linux_fallback():
    with patch("shutil.which", return_value=None), \
         patch("platform.system", return_value="Linux"), \
         patch("os.path.exists") as mock_exists, \
         patch("os.path.isfile", return_value=True):
        def side_effect(path):
            return path == "/usr/bin/tesseract"
        mock_exists.side_effect = side_effect

        bin_path = find_tesseract_binary()
        assert bin_path == "/usr/bin/tesseract"


def test_ocr_service_init_linux_pytesseract(caplog):
    with patch("platform.system", return_value="Linux"), \
         patch("backend.app.services.ocr_service.find_tesseract_binary", return_value="/usr/bin/tesseract"), \
         patch.dict("sys.modules", {"winocr": None}):
        with caplog.at_level(logging.INFO):
            service = OCRService()
            assert service.winocr is None
            assert service.engine_name == "pytesseract"
            assert "OCR engine selected: pytesseract" in caplog.text


def test_ocr_service_init_none(caplog):
    with patch("platform.system", return_value="Linux"), \
         patch("backend.app.services.ocr_service.find_tesseract_binary", return_value=None), \
         patch("shutil.which", return_value=None), \
         patch.dict("sys.modules", {"winocr": None, "pytesseract": None}):
        with caplog.at_level(logging.WARNING):
            service = OCRService()
            assert service.winocr is None
            assert service.pytesseract is None
            assert service.engine_name == "none"
            assert "OCR engine selected: none" in caplog.text


def test_ocr_service_structured_failure_response_when_no_engine(tmp_path):
    dummy_img_path = str(tmp_path / "test.png")
    img = Image.new("RGB", (100, 100), color="white")
    img.save(dummy_img_path)

    service = OCRService()
    service.winocr = None
    service.pytesseract = None
    service.engine_name = "none"

    result = service.extract_text_from_image(dummy_img_path)
    assert result["success"] is False
    assert result["engine"] == "none"
    assert result["raw_text"] == ""
    assert result["lines"] == []
    assert "No OCR engine available" in result["error"]


def test_ocr_service_winocr_fallback_to_pytesseract(tmp_path):
    dummy_img_path = str(tmp_path / "test_fallback.png")
    img = Image.new("RGB", (100, 100), color="white")
    img.save(dummy_img_path)

    mock_winocr = MagicMock()
    mock_winocr.recognize_pil_sync.side_effect = RuntimeError("WinRT execution failed")

    mock_pytess = MagicMock()
    mock_pytess.image_to_string.return_value = "Sample Store\nTotal: 100.00"

    service = OCRService()
    service.winocr = mock_winocr
    service.pytesseract = mock_pytess
    service.engine_name = "winocr"

    result = service.extract_text_from_image(dummy_img_path)
    assert result["success"] is True
    assert result["engine"] == "pytesseract"
    assert len(result["lines"]) == 2
