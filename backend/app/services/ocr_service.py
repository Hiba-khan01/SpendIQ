import os
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional
from PIL import Image, ImageEnhance

logger = logging.getLogger(__name__)

# Dedicated thread pool for OCR computation (avoids asyncio loop collision on Windows)
ocr_executor = ThreadPoolExecutor(max_workers=3)

class OCRService:
    def __init__(self):
        self.winocr = None
        self.pytesseract = None
        self.engine_name = "none"
        self._init_ocr_engines()

    def _init_ocr_engines(self):
        # 1. Check winocr (Windows Native Media OCR)
        try:
            import winocr
            self.winocr = winocr
            self.engine_name = "winocr"
            logger.info("OCR Service: Initialized native Windows OCR engine (winocr).")
            return
        except ImportError:
            self.winocr = None

        # 2. Check pytesseract as fallback
        try:
            import pytesseract
            tess_exe_candidates = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                r"C:\Users\hibak\AppData\Local\Tesseract-OCR\tesseract.exe",
            ]
            for cand in tess_exe_candidates:
                if os.path.exists(cand):
                    pytesseract.pytesseract.tesseract_cmd = cand
                    break
            self.pytesseract = pytesseract
            self.engine_name = "pytesseract"
            logger.info("OCR Service: Initialized Tesseract OCR engine.")
            return
        except ImportError:
            self.pytesseract = None

        logger.warning("OCR Service: No OCR engine available.")

    def _preprocess_image(self, image_path: str) -> Optional[Image.Image]:
        try:
            img = Image.open(image_path)
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Upscale if low resolution to improve OCR recognition
            if img.width < 1000:
                scale = 1200 / max(img.width, 1)
                new_size = (int(img.width * scale), int(img.height * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            # Moderate contrast enhancement for crisp text
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.3)
            return img
        except Exception as exc:
            logger.error(f"Image preprocessing failed for {image_path}: {exc}")
            return None

    def _reconstruct_horizontal_lines(self, ocr_res: dict, y_threshold: float = 16.0) -> List[str]:
        """
        Reconstructs horizontal receipt lines using word bounding boxes so that
        left item names and right item prices are placed on the exact same line in reading order.
        """
        all_words = []
        for line in ocr_res.get("lines", []):
            for word in line.get("words", []):
                rect = word.get("bounding_rect", {})
                w_text = word.get("text", "").strip()
                if w_text:
                    all_words.append({
                        "text": w_text,
                        "x": rect.get("x", 0.0),
                        "y": rect.get("y", 0.0),
                        "w": rect.get("width", 0.0),
                        "h": rect.get("height", 0.0)
                    })

        if not all_words:
            raw_lines = [l.get("text", "").strip() for l in ocr_res.get("lines", [])]
            return [l for l in raw_lines if l]

        # Sort words primarily by vertical coordinate (top to bottom), then horizontal (left to right)
        all_words.sort(key=lambda w: (w["y"], w["x"]))

        grouped_lines = []
        current_group = []
        current_y = None

        for w in all_words:
            if current_y is None:
                current_group.append(w)
                current_y = w["y"]
            elif abs(w["y"] - current_y) <= y_threshold:
                current_group.append(w)
            else:
                # Sort current horizontal line from left to right
                current_group.sort(key=lambda item: item["x"])
                line_str = " ".join(item["text"] for item in current_group)
                if line_str.strip():
                    grouped_lines.append(line_str.strip())
                current_group = [w]
                current_y = w["y"]

        if current_group:
            current_group.sort(key=lambda item: item["x"])
            line_str = " ".join(item["text"] for item in current_group)
            if line_str.strip():
                grouped_lines.append(line_str.strip())

        return grouped_lines

    def _run_winocr_sync(self, img: Image.Image) -> dict:
        return self.winocr.recognize_pil_sync(img, "en")

    def extract_text_from_image(self, image_path: str) -> Dict[str, Any]:
        """
        Extracts raw text and ordered lines from an image file using OCR.
        Never returns mock or hardcoded data.
        """
        if not os.path.exists(image_path):
            logger.error(f"Image path does not exist: {image_path}")
            return {
                "raw_text": "",
                "lines": [],
                "engine": self.engine_name,
                "success": False,
                "error": "File not found"
            }

        img = self._preprocess_image(image_path)
        if img is None:
            return {
                "raw_text": "",
                "lines": [],
                "engine": self.engine_name,
                "success": False,
                "error": "Image decoding failed"
            }

        # 1. Native Windows OCR executed via ThreadPool to ensure clean event loop isolation
        if self.winocr is not None:
            try:
                future = ocr_executor.submit(self._run_winocr_sync, img)
                res = future.result(timeout=15)
                lines = self._reconstruct_horizontal_lines(res)
                raw_text = "\n".join(lines) if lines else res.get("text", "")
                
                logger.info(f"winocr extracted {len(lines)} lines ({len(raw_text)} chars) from {os.path.basename(image_path)}")
                return {
                    "raw_text": raw_text,
                    "lines": lines,
                    "engine": "winocr",
                    "success": bool(raw_text and len(raw_text.strip()) > 3)
                }
            except Exception as e:
                logger.warning(f"winocr execution failed on {image_path}: {e}")

        # 2. Pytesseract fallback
        if self.pytesseract is not None:
            try:
                raw_text = self.pytesseract.image_to_string(img)
                lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
                logger.info(f"pytesseract extracted {len(lines)} lines from {os.path.basename(image_path)}")
                return {
                    "raw_text": raw_text,
                    "lines": lines,
                    "engine": "pytesseract",
                    "success": bool(raw_text and len(raw_text.strip()) > 3)
                }
            except Exception as e:
                logger.warning(f"pytesseract execution failed on {image_path}: {e}")

        logger.warning(f"No text could be extracted from receipt: {image_path}")
        return {
            "raw_text": "",
            "lines": [],
            "engine": self.engine_name,
            "success": False,
            "error": "No OCR engine available or OCR returned empty content"
        }

ocr_service = OCRService()
