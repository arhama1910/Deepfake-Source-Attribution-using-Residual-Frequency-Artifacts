from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import Analysis
from app.storage.local import storage

router = APIRouter()

@router.get("/history")
def get_analysis_history(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    media_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve historical forensic cases."""
    query = db.query(Analysis)
    if media_type:
        query = query.filter(Analysis.media_type == media_type)
        
    total_count = query.count()
    records = query.order_by(Analysis.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for r in records:
        pred = r.prediction
        results.append({
            "id": r.id,
            "filename": r.filename,
            "media_type": r.media_type,
            "file_size": r.file_size,
            "resolution": r.resolution,
            "duration": r.duration,
            "status": r.status,
            "stage": r.stage,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "prediction": {
                "is_synthetic": pred.is_synthetic if pred else None,
                "synthetic_probability": pred.synthetic_probability if pred else None,
                "source_class": pred.source_class if pred else "Model Not Loaded",
                "source_confidence": pred.source_confidence if pred else None,
                "model_status": pred.model_status if pred else "not_loaded"
            } if pred else None,
            "thumbnail_url": r.original_url
        })
        
    return {
        "success": True,
        "data": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "items": results
        }
    }

@router.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Delete an analysis case and clean up associated stored visual artifacts."""
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis case not found.")
        
    # Delete associated static files
    for url in [record.original_url, record.residual_url, record.fft_url, record.dct_url]:
        if url:
            storage.delete_file(url)
            
    for f in record.frame_analyses:
        for f_url in [f.frame_thumbnail_url, f.frame_residual_url, f.frame_fft_url, f.frame_dct_url]:
            if f_url:
                storage.delete_file(f_url)
                
    db.delete(record)
    db.commit()
    
    return {
        "success": True,
        "data": {"deleted_id": analysis_id},
        "message": "Analysis case successfully purged."
    }
