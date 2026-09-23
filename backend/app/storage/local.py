import os
import cv2
import numpy as np
from pathlib import Path
from typing import BinaryIO
from app.core.config import settings
from app.storage.base import StorageProvider

class LocalStorageProvider(StorageProvider):
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.static_dir = settings.STATIC_DIR
        self.reports_dir = settings.REPORTS_DIR
        
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.static_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    async def save_stream(self, stream: BinaryIO, filename: str) -> str:
        dest_path = self.upload_dir / filename
        with open(dest_path, "wb") as f:
            while chunk := await stream.read(1024 * 1024):  # 1MB chunks
                f.write(chunk)
        return str(dest_path)

    def save_image(self, image: np.ndarray, filename: str) -> str:
        """
        Save numpy array image (RGB or BGR or grayscale) into static directory
        and return web-accessible relative path '/static/<filename>'.
        """
        dest_path = self.static_dir / filename
        # Ensure image is in proper uint8 format
        if image.dtype != np.uint8:
            image = np.clip(image, 0, 255).astype(np.uint8)
        
        # If image has 3 channels, OpenCV imwrite expects BGR
        if len(image.shape) == 3 and image.shape[2] == 3:
            # We assume image is passed as RGB from PIL or OpenCV converted
            cv2.imwrite(str(dest_path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
        else:
            cv2.imwrite(str(dest_path), image)
            
        return f"/static/{filename}"

    def get_absolute_path(self, identifier: str) -> Path:
        if identifier.startswith("/static/"):
            return self.static_dir / identifier.replace("/static/", "")
        if identifier.startswith("/reports/"):
            return self.reports_dir / identifier.replace("/reports/", "")
        return Path(identifier)

    def delete_file(self, identifier: str) -> bool:
        try:
            path = self.get_absolute_path(identifier)
            if path.exists() and path.is_file():
                os.remove(path)
                return True
        except Exception:
            pass
        return False

storage = LocalStorageProvider()
