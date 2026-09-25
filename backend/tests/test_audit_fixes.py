import io
import tempfile
from pathlib import Path
import pytest
import numpy as np
import torch
import cv2
from PIL import Image
from fastapi.testclient import TestClient

from app.database.session import SessionLocal, init_db
from app.database.models import Analysis, FrequencyAnalysis
from app.main import app
from app.ml.image_model import image_model, prepare_image_tensors, DeepTraceAttributionNetwork
from app.ml.video_model import video_model, build_temporal_feature_tensor, VideoTemporalPoolingHead
from app.forensics.video_processor import process_video_frames

init_db()
client = TestClient(app)

def create_test_image_bytes(width=256, height=256) -> bytes:
    """Generate deterministic test image with frequency textures."""
    y, x = np.indices((height, width))
    checker = ((x // 16) % 2) ^ ((y // 16) % 2)
    gray = (checker * 180 + 30).astype(np.uint8)
    bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    _, encoded = cv2.imencode(".jpg", bgr)
    return encoded.tobytes()

def create_synthetic_test_video(num_frames=8, width=128, height=128) -> Path:
    """Create a temporary MP4 video file with moving patterns."""
    temp_dir = Path(tempfile.gettempdir())
    video_path = temp_dir / "deeptrace_test_vid.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(video_path), fourcc, 10.0, (width, height))
    
    for i in range(num_frames):
        y, x = np.indices((height, width))
        frame = ((x + i * 4) % 32 < 16).astype(np.uint8) * 200 + 20
        bgr = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
        out.write(bgr)
    out.release()
    return video_path

# ==============================================================================
# 1. IMAGE INFERENCE TENSOR CONSTRUCTION & SAFETY TESTS
# ==============================================================================
def test_image_inference_tensor_construction():
    roi = np.full((256, 256, 3), 120, dtype=np.uint8)
    res = np.full((256, 256, 3), 40, dtype=np.uint8)
    fft = np.full((256, 256), 60, dtype=np.uint8)
    dct = np.full((256, 256), 80, dtype=np.uint8)
    
    rgb_t, res_t, fft_t, dct_t = prepare_image_tensors(roi, res, fft, dct)
    
    assert rgb_t.shape == (1, 3, 256, 256)
    assert res_t.shape == (1, 3, 256, 256)
    assert fft_t.shape == (1, 1, 256, 256)
    assert dct_t.shape == (1, 1, 256, 256)
    assert rgb_t.dtype == torch.float32
    
    # Test safe response when model is not loaded
    pred = image_model.predict(rgb_tensor=rgb_t, residual_tensor=res_t, fft_tensor=fft_t, dct_tensor=dct_t)
    assert pred["model_status"] == "not_loaded"
    assert pred["source_class"] in ["Model Not Loaded", "Attribution unavailable: trained checkpoint not loaded."]
    assert pred["is_synthetic"] is None

    # Test forward pass with real tensors when loaded (no AttributeError)
    orig_loaded = image_model.is_loaded
    try:
        image_model.is_loaded = True
        loaded_pred = image_model.predict(rgb_tensor=rgb_t, residual_tensor=res_t, fft_tensor=fft_t, dct_tensor=dct_t)
        assert loaded_pred["model_status"] == "loaded"
        assert "source_class" in loaded_pred
        assert "synthetic_probability" in loaded_pred
        assert loaded_pred["source_class"] != "Model Not Loaded"
    finally:
        image_model.is_loaded = orig_loaded

# ==============================================================================
# 2. VIDEO INFERENCE TENSOR CONSTRUCTION & SAFETY TESTS
# ==============================================================================
def test_video_inference_tensor_construction():
    frame_list = [
        {
            "roi": np.full((128, 128, 3), 100 + i * 5, dtype=np.uint8),
            "res": np.full((128, 128, 3), 20, dtype=np.uint8),
            "fft": np.full((128, 128), 30, dtype=np.uint8),
            "dct": np.full((128, 128), 40, dtype=np.uint8)
        }
        for i in range(8)
    ]
    
    temp_tensor = build_temporal_feature_tensor(frame_list, image_network=image_model.network, device=video_model.device)
    assert temp_tensor.shape == (1, 8, 256)
    assert temp_tensor.dtype == torch.float32
    
    # Test safe prediction when model is not loaded
    pred = video_model.predict(temporal_tensor=temp_tensor)
    assert pred["model_status"] == "not_loaded"
    assert pred["source_class"] in ["Model Not Loaded", "Attribution unavailable: trained checkpoint not loaded."]

    # Test forward pass with temporal tensor when loaded (no AttributeError)
    orig_loaded = video_model.is_loaded
    try:
        video_model.is_loaded = True
        loaded_pred = video_model.predict(temporal_tensor=temp_tensor)
        assert loaded_pred["model_status"] == "loaded"
        assert "source_class" in loaded_pred
    finally:
        video_model.is_loaded = orig_loaded

# ==============================================================================
# 3. REAL RESIDUAL VARIANCE PERSISTENCE TESTS
# ==============================================================================
def test_real_residual_variance_persistence():
    img_bytes = create_test_image_bytes(256, 256)
    files = {"file": ("residual_test.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    
    response = client.post("/api/v1/analyze/image", files=files, data={"analysis_mode": "full"})
    assert response.status_code == 200
    res_data = response.json()["data"]
    analysis_id = res_data["id"]
    
    measured_variance = res_data["residual_metrics"]["residual_variance"]
    assert measured_variance > 0.0
    
    # Check directly from SQLite database
    db = SessionLocal()
    try:
        freq_record = db.query(FrequencyAnalysis).filter(FrequencyAnalysis.analysis_id == analysis_id).first()
        assert freq_record is not None
        assert freq_record.residual_variance is not None
        assert pytest.approx(freq_record.residual_variance, abs=0.0001) == measured_variance
    finally:
        db.close()
        
    # Check retrieval via GET endpoint
    get_res = client.get(f"/api/v1/analysis/{analysis_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()["data"]
    assert "residual_metrics" in get_data
    assert pytest.approx(get_data["residual_metrics"]["residual_variance"], abs=0.0001) == measured_variance

# ==============================================================================
# 4. VIDEO FREQUENCY METRIC CALCULATION TESTS
# ==============================================================================
def test_video_frequency_metric_calculation():
    vid_path = create_synthetic_test_video(num_frames=8, width=128, height=128)
    try:
        sampled_results, summary, frame_tensor_list = process_video_frames(
            vid_path, analysis_id="test_vid_123", num_samples=8
        )
        assert len(sampled_results) == 8
        assert len(frame_tensor_list) == 8
        
        # Verify calculated summary metrics are genuine non-zero floats, not hardcoded dummy constants
        assert "mean_low_freq_energy" in summary
        assert "mean_mid_freq_energy" in summary
        assert "mean_high_freq_energy" in summary
        assert "mean_dct_total_energy" in summary
        assert "mean_residual_variance" in summary
        
        assert summary["mean_low_freq_energy"] > 0.0
        assert summary["mean_mid_freq_energy"] > 0.0
        assert summary["mean_residual_variance"] >= 0.0
        assert summary["mean_dct_total_energy"] > 0.0
    finally:
        if vid_path.exists():
            vid_path.unlink()

# ==============================================================================
# 5. INVALID UPLOADS TESTS
# ==============================================================================
def test_invalid_upload_empty_file():
    empty_file = io.BytesIO(b"")
    files = {"file": ("empty.jpg", empty_file, "image/jpeg")}
    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_invalid_upload_corrupt_or_spoofed_mime():
    # File named .jpg but contains plain text (magic bytes mismatch)
    fake_img = io.BytesIO(b"Hello world this is not an image at all.")
    files = {"file": ("fake.jpg", fake_img, "image/jpeg")}
    response = client.post("/api/v1/analyze/image", files=files)
    assert response.status_code in [400, 415]

# ==============================================================================
# 6. MISSING MODEL CHECKPOINT SAFE RESPONSE TESTS
# ==============================================================================
def test_missing_model_checkpoint_safe_response():
    models_res = client.get("/api/v1/models")
    assert models_res.status_code == 200
    data = models_res.json()["data"]
    assert data["image_model"]["model_status"] == "not_loaded"
    assert data["video_model"]["model_status"] == "not_loaded"
    
    metrics_res = client.get("/api/v1/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()["data"]
    assert "experimental_model" in m_data
    assert m_data["experimental_model"]["status"] == "Not evaluated"
    assert m_data["experimental_model"]["checkpoint"] == "Not available"
    assert m_data["experimental_model"]["evaluation_status"] == "Awaiting trained evaluation"

# ==============================================================================
# 7. EXPLANATION ENDPOINT TESTS
# ==============================================================================
def test_explanation_endpoint_uses_real_evidence():
    img_bytes = create_test_image_bytes(256, 256)
    files = {"file": ("explain_test.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    
    create_res = client.post("/api/v1/analyze/image", files=files, data={"analysis_mode": "full"})
    assert create_res.status_code == 200
    analysis_id = create_res.json()["data"]["id"]
    
    explain_res = client.post(f"/api/v1/analysis/{analysis_id}/explain")
    assert explain_res.status_code == 200
    res_json = explain_res.json()
    assert res_json["success"] is True
    explanation = res_json["data"]["explanation"]
    
    assert "Forensic Preprocessing" in explanation
    assert "Research Demo Mode" in explanation or "unavailable" in explanation.lower()
    assert "Forensic Disclaimer" in explanation
