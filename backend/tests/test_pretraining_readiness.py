import os
import sys
import json
import tempfile
from pathlib import Path
import pytest
import numpy as np
import torch
import torch.nn as nn
import cv2

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.session import init_db
from app.ml.base import ATTRIBUTION_CLASSES
from app.ml.image_model import DeepTraceAttributionNetwork, ImageAttributionModel, prepare_image_tensors
from app.ml.validate_dataset import validate_dataset_structure
from app.ml.evaluate import calculate_classification_metrics
from fastapi.testclient import TestClient
from app.main import app

init_db()
client = TestClient(app)

# 1. Dataset Validation Test
def test_dataset_validation():
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        # Create valid structure
        counter = 1
        for split in ["train", "val", "test"]:
            for cls_name in ATTRIBUTION_CLASSES:
                cls_dir = root / split / cls_name
                cls_dir.mkdir(parents=True)
                # Create a small valid dummy JPEG with unique pixel to avoid duplicate hash
                dummy_file = cls_dir / "sample_001.jpg"
                dummy_img = np.ones((64, 64, 3), dtype=np.uint8) * 100
                dummy_img[0, 0, 0] = (counter * 7) % 255
                dummy_img[0, 1, 1] = (counter * 13) % 255
                cv2.imwrite(str(dummy_file), dummy_img)
                counter += 1
                
        is_valid, report = validate_dataset_structure(root, strict=True)
        assert is_valid is True
        assert report["total_files"] == 24
        assert report["train_count"] == 8
        assert report["val_count"] == 8
        assert report["test_count"] == 8
        assert report["duplicate_files"] == 0
        assert report["corrupted_files"] == 0

def test_dataset_validation_missing_classes():
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        # Create splits but missing classes
        (root / "train" / "Real").mkdir(parents=True)
        (root / "val" / "Real").mkdir(parents=True)
        (root / "test" / "Real").mkdir(parents=True)
        dummy_file = root / "train" / "Real" / "sample.jpg"
        cv2.imwrite(str(dummy_file), np.zeros((32, 32, 3), dtype=np.uint8))
        
        is_valid, report = validate_dataset_structure(root, strict=True)
        assert is_valid is False
        assert len(report["errors"]) > 0

# 2. Class Mapping Test
def test_class_mapping():
    assert len(ATTRIBUTION_CLASSES) == 8
    assert ATTRIBUTION_CLASSES[0] == "Real"
    assert "StyleGAN2" in ATTRIBUTION_CLASSES
    assert "StyleGAN3" in ATTRIBUTION_CLASSES
    assert "ProGAN" in ATTRIBUTION_CLASSES
    assert "Stable Diffusion v1.5" in ATTRIBUTION_CLASSES
    assert "Stable Diffusion XL" in ATTRIBUTION_CLASSES
    assert "Latent Diffusion" in ATTRIBUTION_CLASSES
    assert "Midjourney v5" in ATTRIBUTION_CLASSES
    class_to_idx = {cls_name: i for i, cls_name in enumerate(ATTRIBUTION_CLASSES)}
    assert class_to_idx["Real"] == 0
    assert len(class_to_idx) == 8

# 3. Model Output Dimensions Test
def test_model_output_dimensions():
    model = DeepTraceAttributionNetwork(num_classes=8)
    model.eval()
    
    batch_size = 2
    dummy_rgb = torch.randn(batch_size, 3, 128, 128)
    dummy_freq = torch.randn(batch_size, 5, 128, 128)
    
    with torch.no_grad():
        det_logits, attr_logits = model(dummy_rgb, dummy_freq)
        
    assert det_logits.shape == (batch_size, 2)
    assert attr_logits.shape == (batch_size, 8)

# 4. Checkpoint Save Test
def test_checkpoint_save():
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = Path(tmpdir) / "test_best.pt"
        model = DeepTraceAttributionNetwork(num_classes=8)
        
        checkpoint_payload = {
            "model_architecture": "DeepTraceAttributionNetwork",
            "classes": ATTRIBUTION_CLASSES,
            "class_to_idx": {cls_name: i for i, cls_name in enumerate(ATTRIBUTION_CLASSES)},
            "training_dataset": "TestDataset",
            "epoch": 5,
            "validation_metrics": {"val_attr_accuracy": 0.88},
            "state_dict": model.state_dict()
        }
        torch.save(checkpoint_payload, save_path)
        assert save_path.is_file()
        assert save_path.stat().st_size > 0

# 5. Checkpoint Load Test
def test_checkpoint_load():
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = Path(tmpdir) / "test_best.pt"
        orig_model = DeepTraceAttributionNetwork(num_classes=8)
        torch.save({
            "model_architecture": "DeepTraceAttributionNetwork",
            "classes": ATTRIBUTION_CLASSES,
            "epoch": 10,
            "training_dataset": "TestDataset",
            "state_dict": orig_model.state_dict()
        }, save_path)
        
        test_wrapper = ImageAttributionModel()
        test_wrapper.load_checkpoint(path=save_path)
        assert test_wrapper.is_loaded is True
        assert test_wrapper.checkpoint_identifier == "test_best.pt"
        assert test_wrapper.model_version == "epoch_10"

# 6. Real Inference with Checkpoint Test
def test_real_inference_with_checkpoint():
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = Path(tmpdir) / "test_best.pt"
        network = DeepTraceAttributionNetwork(num_classes=8)
        torch.save({"state_dict": network.state_dict(), "classes": ATTRIBUTION_CLASSES}, save_path)
        
        loaded_model = ImageAttributionModel()
        loaded_model.load_checkpoint(path=save_path)
        assert loaded_model.is_loaded is True
        
        dummy_rgb = torch.randn(1, 3, 64, 64)
        dummy_res = torch.randn(1, 3, 64, 64)
        dummy_fft = torch.randn(1, 1, 64, 64)
        dummy_dct = torch.randn(1, 1, 64, 64)
        
        result = loaded_model.predict(dummy_rgb, dummy_res, dummy_fft, dummy_dct)
        assert result["model_status"] == "loaded"
        assert result["source_class"] in ATTRIBUTION_CLASSES
        assert result["is_synthetic"] in [True, False]
        assert result["synthetic_probability"] is not None
        assert result["source_confidence"] is not None
        assert result["evidence_features"] is not None
        assert len(result["class_probabilities"]) == 8

# 7. Missing Checkpoint Behavior Test
def test_missing_checkpoint_behavior():
    unweighted_model = ImageAttributionModel()
    unweighted_model.is_loaded = False
    
    # Override load_checkpoint to simulate missing checkpoint
    unweighted_model.load_checkpoint = lambda path=None: False
    
    pred = unweighted_model.predict()
    assert pred["model_status"] == "not_loaded"
    assert pred["source_class"] == "Attribution unavailable: trained checkpoint not loaded."
    assert pred["source_confidence"] is None
    assert pred["synthetic_probability"] is None
    for cls_name in ATTRIBUTION_CLASSES:
        assert pred["class_probabilities"][cls_name] is None

# 8. Invalid Checkpoint Behavior Test
def test_invalid_checkpoint_behavior():
    with tempfile.TemporaryDirectory() as tmpdir:
        corrupted_file = Path(tmpdir) / "corrupt.pt"
        with open(corrupted_file, "wb") as f:
            f.write(b"NOT_A_VALID_PYTORCH_FILE_HEADER")
            
        model = ImageAttributionModel()
        res = model.load_checkpoint(path=corrupted_file)
        assert res is False
        assert model.is_loaded is False

# 9. Class Mismatch Behavior Test
def test_class_mismatch_behavior():
    with tempfile.TemporaryDirectory() as tmpdir:
        mismatch_path = Path(tmpdir) / "mismatch.pt"
        # Network with only 3 classes
        diff_network = DeepTraceAttributionNetwork(num_classes=3)
        torch.save({
            "state_dict": diff_network.state_dict(),
            "classes": ["Real", "ClassA", "ClassB"]
        }, mismatch_path)
        
        model = ImageAttributionModel()
        # Loading mismatch state_dict raises runtime error or returns False
        res = model.load_checkpoint(path=mismatch_path)
        assert res is False or model.is_loaded is False

# 10. Evaluation Metrics Calculation Test
def test_evaluation_metrics_math():
    y_true = np.array([0, 0, 1, 2, 2])
    y_pred = np.array([0, 0, 1, 2, 1])  # 4/5 correct = 80% accuracy
    classes = ["Real", "Synth1", "Synth2"]
    
    metrics = calculate_classification_metrics(y_true, y_pred, None, classes)
    assert metrics["overall_accuracy"] == 0.8
    assert metrics["total_evaluated_samples"] == 5
    assert len(metrics["per_class_metrics"]) == 3
    # Check confusion matrix
    cm = np.array(metrics["confusion_matrix"])
    assert cm.shape == (3, 3)
    assert cm[0, 0] == 2  # 2 true Real predicted as Real
    assert cm[2, 1] == 1  # 1 true Synth2 predicted as Synth1

# 11. API Attribution Response Test
def test_api_attribution_response():
    resp = client.get("/api/v1/models")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "image_model" in data
    assert "video_model" in data
    assert "attribution_classes" in data
    assert len(data["attribution_classes"]) == 8
    
    metrics_resp = client.get("/api/v1/metrics")
    assert metrics_resp.status_code == 200
    metrics_data = metrics_resp.json()["data"]
    assert "status" in metrics_data
    assert "experimental_model" in metrics_data
    assert "literature_reference_metrics" in metrics_data
