from fastapi import APIRouter
from app.api.v1.analyze import router as analyze_router
from app.api.v1.history import router as history_router
from app.api.v1.report import router as report_router
from app.api.v1.models import router as models_router
from app.api.v1.explain import router as explain_router

api_router = APIRouter()

api_router.include_router(analyze_router, tags=["Forensic Analysis"])
api_router.include_router(history_router, tags=["Analysis History"])
api_router.include_router(report_router, tags=["Forensic Reports"])
api_router.include_router(models_router, tags=["Model Registry & Metrics"])
api_router.include_router(explain_router, tags=["Explainability"])
