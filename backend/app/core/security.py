import os
import re
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_IMAGE_MIME = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"]
}

ALLOWED_VIDEO_MIME = {
    "video/mp4": [b"ftyp", b"\x00\x00\x00"],
    "video/quicktime": [b"moov", b"mdat", b"ftyp"],
    "video/x-msvideo": [b"RIFF"],
    "video/webm": [b"\x1a\x45\xdf\xa3"]
}

ALLOWED_EXTENSIONS = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "avi": "video/x-msvideo",
    "webm": "video/webm"
}

def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters and directory traversal patterns."""
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    if not clean_name:
        clean_name = f"upload_{uuid.uuid4().hex[:8]}"
    return clean_name

def generate_secure_storage_path(original_filename: str, media_type: str = "image") -> Tuple[str, Path]:
    ext = Path(original_filename).suffix.lower()
    if not ext:
        ext = ".jpg" if media_type == "image" else ".mp4"
    unique_id = uuid.uuid4().hex
    secure_filename = f"{unique_id}{ext}"
    target_path = settings.UPLOAD_DIR / secure_filename
    return unique_id, target_path

async def validate_uploaded_file(file: UploadFile, expected_media_type: str = None) -> Tuple[str, int]:
    """
    Validate file size, extension, and content magic bytes.
    Does not trust extension alone.
    """
    header = await file.read(2048)
    if not header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty or corrupted."
        )
    
    # Reset read pointer
    await file.seek(0)
    
    # Determine size safely across different async UploadFile implementations
    file_size = getattr(file, "size", None)
    if file_size is None or file_size == 0:
        content = await file.read()
        file_size = len(content)
        await file.seek(0)
    
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )
    
    content_type = file.content_type or ""
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower().lstrip(".")
    
    detected_mime = None
    
    # Magic bytes check for images
    if header.startswith(b"\xff\xd8\xff"):
        detected_mime = "image/jpeg"
    elif header.startswith(b"\x89PNG\r\n\x1a\n"):
        detected_mime = "image/png"
    elif header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP":
        detected_mime = "image/webp"
    # Magic bytes check for videos
    elif header.startswith(b"\x1a\x45\xdf\xa3"):
        detected_mime = "video/webm"
    elif header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"AVI ":
        detected_mime = "video/x-msvideo"
    elif b"ftyp" in header[:32]:
        detected_mime = "video/mp4"
    elif b"moov" in header[:64] or b"mdat" in header[:64]:
        detected_mime = "video/quicktime"
    
    # Fallback to extension if magic byte match was partial or container variation
    if not detected_mime:
        detected_mime = ALLOWED_EXTENSIONS.get(ext)
        
    if not detected_mime:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported media format. Supported formats: JPG, PNG, WEBP, MP4, MOV, AVI, WEBM."
        )
        
    media_category = "image" if detected_mime.startswith("image/") else "video"
    if expected_media_type and media_category != expected_media_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {expected_media_type} file, but received {media_category}."
        )
        
    return detected_mime, file_size
