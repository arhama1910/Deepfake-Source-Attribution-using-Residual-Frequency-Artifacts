from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import init_db
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on application startup
    init_db()
    print("[DeepTrace AI] Core database and forensic storage initialized successfully.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Research-Oriented Deepfake Source Attribution Platform Using Residual Frequency Artifacts",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static artifacts directory for browser image inspection
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "mode": "Research & Forensics",
        "storage": settings.STORAGE_TYPE
    }

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Global safe error handling: never leak unhandled raw Python tracebacks to client
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred during forensic processing.",
                "details": str(exc)
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
