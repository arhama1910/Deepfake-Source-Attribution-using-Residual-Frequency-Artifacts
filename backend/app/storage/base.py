from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO
import numpy as np

class StorageProvider(ABC):
    @abstractmethod
    async def save_stream(self, stream: BinaryIO, filename: str) -> str:
        """Save a binary file stream and return its accessible URL/path identifier."""
        pass

    @abstractmethod
    def save_image(self, image: np.ndarray, filename: str) -> str:
        """Save a numpy image array (BGR or RGB) and return URL/path identifier."""
        pass

    @abstractmethod
    def get_absolute_path(self, identifier: str) -> Path:
        """Resolve identifier to local filesystem path."""
        pass

    @abstractmethod
    def delete_file(self, identifier: str) -> bool:
        """Delete stored file."""
        pass
