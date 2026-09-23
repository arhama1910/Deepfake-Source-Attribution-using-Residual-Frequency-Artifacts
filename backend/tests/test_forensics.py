import pytest
import numpy as np

from app.forensics.residual import extract_residual_pipeline, SRM_KERNELS
from app.forensics.fft_analysis import (
    compute_fft_spectrum, compute_frequency_energy_bands, compute_spectral_entropy,
    compute_radial_profile, analyze_fft_pipeline
)
from app.forensics.dct_analysis import compute_2d_dct, compute_dct_metrics, analyze_dct_pipeline
from app.forensics.face_detection import detect_and_align_face

def create_synthetic_test_image(height=256, width=256):
    """Generate deterministic synthetic test pattern (checkerboard with noise)."""
    y, x = np.indices((height, width))
    pattern = ((x // 16) % 2) ^ ((y // 16) % 2)
    img_gray = (pattern * 200 + 20).astype(np.uint8)
    # Add high frequency periodic line
    img_gray += (np.sin(x * 0.5) * 20).astype(np.uint8)
    return np.stack([img_gray, img_gray, img_gray], axis=-1)

def test_srm_residual_extraction():
    img = create_synthetic_test_image()
    vis_res, metrics = extract_residual_pipeline(img)
    
    assert vis_res is not None
    assert vis_res.shape == img.shape
    assert vis_res.dtype == np.uint8
    assert "residual_variance" in metrics
    assert metrics["residual_variance"] >= 0.0

def test_fft_analysis_pipeline():
    img = create_synthetic_test_image()
    vis_fft, metrics, radial_profile = analyze_fft_pipeline(img)
    
    assert vis_fft is not None
    assert vis_fft.shape == img.shape
    assert "low_frequency_energy" in metrics
    assert "mid_frequency_energy" in metrics
    assert "high_frequency_energy" in metrics
    assert "spectral_entropy" in metrics
    
    # Check that energy ratios sum to ~1.0
    energy_sum = (
        metrics["low_frequency_energy"] +
        metrics["mid_frequency_energy"] +
        metrics["high_frequency_energy"]
    )
    assert pytest.approx(energy_sum, abs=0.01) == 1.0
    assert metrics["spectral_entropy"] > 0.0
    assert len(radial_profile) > 0

def test_dct_analysis_pipeline():
    img = create_synthetic_test_image()
    vis_dct, metrics = analyze_dct_pipeline(img)
    
    assert vis_dct is not None
    assert vis_dct.shape == img.shape
    assert "dct_total_energy" in metrics
    assert "dct_high_freq_ratio" in metrics
    assert 0.0 <= metrics["dct_high_freq_ratio"] <= 1.0

def test_face_detection_fallback():
    img = create_synthetic_test_image(300, 400)
    aligned, face_found, face_count, bboxes = detect_and_align_face(img, target_size=256)
    
    assert aligned.shape == (256, 256, 3)
    # On synthetic geometric grid, face detector returns False gracefully without crash
    assert isinstance(face_found, bool)
    assert isinstance(face_count, int)
