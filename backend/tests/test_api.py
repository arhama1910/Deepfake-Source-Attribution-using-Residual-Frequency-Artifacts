import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.database.session import init_db
from app.main import app

# Ensure SQLite test tables are initialized
init_db()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "DeepTrace AI" in data["service"]

def test_models_registry_endpoint():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "image_model" in data["data"]
    assert "video_model" in data["data"]
    assert "attribution_classes" in data["data"]

def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "status" in data["data"]

def test_history_endpoint():
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data["data"]

def test_image_analysis_endpoint():
    img = Image.new("RGB", (128, 128), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    
    files = {"file": ("test_sample.jpg", buf, "image/jpeg")}
    data = {"analysis_mode": "full"}
    
    response = client.post("/api/v1/analyze/image", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "visual_artifacts" in res_data["data"]
    assert "frequency_metrics" in res_data["data"]
    assert "prediction" in res_data["data"]
    assert "explanation" in res_data["data"]
    assert res_data["data"]["prediction"]["model_status"] == "not_loaded"
