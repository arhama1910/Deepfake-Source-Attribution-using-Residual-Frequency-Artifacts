from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import Analysis
from app.llm.provider import llm_service

router = APIRouter()

class ExplainRequest(BaseModel):
    query: Optional[str] = None

@router.post("/analysis/{analysis_id}/explain")
async def explain_analysis_endpoint(
    analysis_id: str,
    payload: ExplainRequest = None,
    db: Session = Depends(get_db)
):
    """Generate structured forensic explanation for a specific case."""
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis reference not found.")
        
    pred = record.prediction
    freq = record.frequency_analysis
    
    evidence = {
        "media_type": record.media_type,
        "prediction": {
            "model_status": pred.model_status if pred else "not_loaded",
            "is_synthetic": pred.is_synthetic if pred else None,
            "synthetic_probability": pred.synthetic_probability if pred else None,
            "source_class": pred.source_class if pred else "Model Not Loaded",
            "source_confidence": pred.source_confidence if pred else None
        },
        "frequency_metrics": {
            "high_frequency_ratio": freq.high_frequency_ratio if freq else 0.0,
            "spectral_entropy": freq.spectral_entropy if freq else 0.0,
            "low_frequency_energy": freq.low_frequency_energy if freq else 0.0,
            "dct_high_frequency_ratio": freq.dct_high_frequency_ratio if freq else 0.0
        },
        "residual_metrics": {"residual_variance": 0.045}
    }
    
    explanation_text = await llm_service.generate_explanation(evidence)
    
    return {
        "success": True,
        "data": {
            "analysis_id": analysis_id,
            "explanation": explanation_text
        }
    }
