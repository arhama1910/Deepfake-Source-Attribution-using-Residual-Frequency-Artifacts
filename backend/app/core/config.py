import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = "DeepTrace AI"
    PROJECT_SUBTITLE: str = "Deepfake Source Attribution Using Residual Frequency Artifacts"
    API_V1_STR: str = "/api/v1"
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local or s3
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    STATIC_DIR: Path = Path(os.getenv("STATIC_DIR", str(BASE_DIR / "static")))
    REPORTS_DIR: Path = Path(os.getenv("REPORTS_DIR", str(BASE_DIR / "reports")))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/deeptrace.db")
    
    # Security
    ALLOWED_HOSTS: list = ["*"]
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    # Model configuration
    IMAGE_MODEL_PATH: str = os.getenv("IMAGE_MODEL_PATH", "")
    VIDEO_MODEL_PATH: str = os.getenv("VIDEO_MODEL_PATH", "")
    MODEL_DEVICE: str = os.getenv("MODEL_DEVICE", "cpu")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "deterministic")  # deterministic, openai, llama, qwen
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_API_BASE: str = os.getenv("LLM_API_BASE", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gpt-4o-mini")

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
