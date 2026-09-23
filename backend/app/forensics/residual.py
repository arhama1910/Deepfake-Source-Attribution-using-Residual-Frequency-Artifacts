import cv2
import numpy as np
from typing import Tuple, Dict, Any

# SRM (Spatial Rich Model) Kernels commonly used in forensic steganalysis
SRM_KERNELS = {
    "1st_order": np.array([
        [0, 0, 0],
        [-1, 1, 0],
        [0, 0, 0]
    ], dtype=np.float32),
    "2nd_order": np.array([
        [0, 0, 0],
        [1, -2, 1],
        [0, 0, 0]
    ], dtype=np.float32),
    "3x3_edge": np.array([
        [-1, 2, -1],
        [2, -4, 2],
        [-1, 2, -1]
    ], dtype=np.float32),
    "5x5_square": np.array([
        [-1, 2, -2, 2, -1],
        [2, -6, 8, -6, 2],
        [-2, 8, -12, 8, -2],
        [2, -6, 8, -6, 2],
        [-1, 2, -2, 2, -1]
    ], dtype=np.float32) / 12.0
}

def extract_highpass_residual(gray_img: np.ndarray, cutoff: int = 5) -> np.ndarray:
    """Isolate high frequency noise by subtracting Gaussian low-pass."""
    lowpass = cv2.GaussianBlur(gray_img, (cutoff, cutoff), 0)
    residual = cv2.subtract(gray_img, lowpass)
    return residual

def extract_laplacian_residual(gray_img: np.ndarray) -> np.ndarray:
    """Laplacian 2nd derivative residual for noise edge discontinuity."""
    laplacian = cv2.Laplacian(gray_img, cv2.CV_64F, ksize=3)
    laplacian_abs = np.abs(laplacian)
    return laplacian_abs

def extract_srm_residual(gray_img: np.ndarray, kernel_name: str = "3x3_edge") -> np.ndarray:
    """Apply high-order SRM linear filter to suppress content and enhance noise residual."""
    kernel = SRM_KERNELS.get(kernel_name, SRM_KERNELS["3x3_edge"])
    filtered = cv2.filter2D(gray_img.astype(np.float32), -1, kernel)
    return filtered

def normalize_residual_for_display(residual: np.ndarray) -> np.ndarray:
    """
    Normalize raw float/int residual to 0-255 uint8 with contrast stretching
    so subtle sub-pixel frequency patterns are visible to forensic analysts.
    """
    res_abs = np.abs(residual)
    min_val = np.min(res_abs)
    max_val = np.max(res_abs)
    if max_val - min_val > 1e-6:
        normalized = ((res_abs - min_val) / (max_val - min_val) * 255.0).astype(np.uint8)
    else:
        normalized = np.zeros_like(res_abs, dtype=np.uint8)
    
    # Apply colormap (e.g., INFERNO or JET or high-contrast grayscale)
    # Using high-contrast heat color for intuitive artifact visualization
    colored = cv2.applyColorMap(normalized, cv2.COLORMAP_INFERNO)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

def extract_residual_pipeline(rgb_image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Full residual extraction pipeline.
    Takes RGB image, computes SRM edge & high-pass residuals,
    and returns display image and quantitative metrics.
    """
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    
    # 1. Compute SRM residual
    srm_res = extract_srm_residual(gray, "3x3_edge")
    
    # 2. Compute Laplacian
    lap_res = extract_laplacian_residual(gray)
    
    # 3. Calculate quantitative metrics
    res_variance = float(np.var(srm_res))
    mean_energy = float(np.mean(np.square(srm_res)))
    peak_residual = float(np.max(np.abs(srm_res)))
    
    # 4. Generate normalized visualization for forensic gallery
    vis_residual = normalize_residual_for_display(srm_res)
    
    metrics = {
        "residual_variance": round(res_variance, 4),
        "mean_energy": round(mean_energy, 4),
        "peak_residual": round(peak_residual, 4),
        "filter_type": "SRM-3x3-Edge + Laplacian"
    }
    
    return vis_residual, metrics
