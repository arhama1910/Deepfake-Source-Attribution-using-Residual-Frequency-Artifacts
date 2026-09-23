import cv2
import numpy as np
from scipy.fftpack import dct
from typing import Tuple, Dict, Any

def compute_2d_dct(gray_img: np.ndarray) -> np.ndarray:
    """
    Compute 2D Type-II Discrete Cosine Transform with orthonormal scaling.
    Applies 1D DCT on rows then on columns.
    """
    # Resize to standard forensic analysis resolution if necessary for speed
    h, w = gray_img.shape
    if max(h, w) > 1024:
        scale = 1024 / max(h, w)
        gray_img = cv2.resize(gray_img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
    img_float = gray_img.astype(np.float32)
    dct_rows = dct(img_float, type=2, axis=0, norm='ortho')
    dct_2d = dct(dct_rows, type=2, axis=1, norm='ortho')
    return dct_2d

def compute_dct_metrics(dct_coeffs: np.ndarray) -> Dict[str, float]:
    """
    Calculate energy distribution in 2D DCT domain.
    Low frequencies are concentrated in the top-left corner (0,0).
    High frequencies are in the bottom-right corner.
    """
    h, w = dct_coeffs.shape
    abs_coeffs = np.abs(dct_coeffs)
    energy = np.square(abs_coeffs)
    total_energy = float(np.sum(energy))
    
    if total_energy <= 1e-9:
        return {
            "dct_total_energy": 0.0,
            "dct_low_freq_energy": 0.0,
            "dct_high_freq_ratio": 0.0,
            "dct_coefficient_variance": 0.0
        }
    
    # Define frequency index distance d = (y/h) + (x/w)
    y, x = np.indices((h, w))
    dist = (y / h) + (x / w)
    
    # Low frequency: dist < 0.3
    # High frequency: dist >= 0.7
    low_mask = dist < 0.3
    high_mask = dist >= 0.7
    
    low_energy = float(np.sum(energy[low_mask]))
    high_energy = float(np.sum(energy[high_mask]))
    
    low_ratio = float(low_energy / total_energy)
    high_ratio = float(high_energy / total_energy)
    coeff_variance = float(np.var(abs_coeffs))
    
    return {
        "dct_total_energy": float(round(total_energy, 2)),
        "dct_low_freq_energy": float(round(low_ratio, 4)),
        "dct_high_freq_ratio": float(round(high_ratio, 4)),
        "dct_high_frequency_ratio": float(round(high_ratio, 4)),
        "dct_coefficient_variance": float(round(coeff_variance, 4))
    }

def visualize_dct_coefficients(dct_coeffs: np.ndarray) -> np.ndarray:
    """
    Log-scale and color-map DCT coefficients for visualization.
    Top-left represents DC/low frequency, bottom-right represents fine textures/high frequencies.
    """
    log_dct = np.log1p(np.abs(dct_coeffs))
    norm = cv2.normalize(log_dct, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    norm_uint8 = norm.astype(np.uint8)
    
    # Use PLASMA colormap for clear distinction from FFT's VIRIDIS
    colored = cv2.applyColorMap(norm_uint8, cv2.COLORMAP_PLASMA)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

def analyze_dct_pipeline(rgb_image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Full DCT analysis pipeline.
    Takes RGB image, computes 2D DCT, calculates coefficient energy metrics,
    and returns visualization and stats.
    """
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    dct_coeffs = compute_2d_dct(gray)
    metrics = compute_dct_metrics(dct_coeffs)
    vis_dct = visualize_dct_coefficients(dct_coeffs)
    
    return vis_dct, metrics
