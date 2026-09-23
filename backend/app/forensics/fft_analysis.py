import cv2
import numpy as np
from typing import Tuple, Dict, Any, List

def compute_fft_spectrum(gray_img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Perform 2D Fast Fourier Transform on grayscale image and shift zero frequency to center.
    Returns:
        f_shift: Complex 2D array of shifted Fourier coefficients
        magnitude_spectrum: Log-scaled magnitude spectrum log(1 + |F|)
    """
    f = np.fft.fft2(gray_img.astype(np.float32))
    f_shift = np.fft.fftshift(f)
    magnitude = np.abs(f_shift)
    magnitude_spectrum = np.log1p(magnitude)
    return f_shift, magnitude_spectrum

def compute_radial_profile(magnitude_spectrum: np.ndarray, num_bins: int = 50) -> List[float]:
    """
    Calculate azimuthal / radial average of the 2D power spectrum.
    Bins frequencies by distance from DC component (center).
    """
    h, w = magnitude_spectrum.shape
    cy, cx = h // 2, w // 2
    
    y, x = np.indices((h, w))
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    max_r = min(cx, cy)
    
    bin_edges = np.linspace(0, max_r, num_bins + 1)
    radial_profile = []
    
    for i in range(num_bins):
        mask = (r >= bin_edges[i]) & (r < bin_edges[i + 1])
        if np.any(mask):
            radial_profile.append(float(np.mean(magnitude_spectrum[mask])))
        else:
            radial_profile.append(0.0)
            
    return radial_profile

def compute_spectral_entropy(magnitude_spectrum: np.ndarray) -> float:
    """
    Compute Shannon entropy of the normalized power spectral density.
    Measures dispersion of frequency energy (GAN/diffusion artifacts often exhibit spikes).
    """
    power = np.square(magnitude_spectrum)
    total_power = np.sum(power)
    if total_power <= 1e-9:
        return 0.0
    prob = power / total_power
    prob_nonzero = prob[prob > 1e-12]
    entropy = -np.sum(prob_nonzero * np.log2(prob_nonzero))
    return float(entropy)

def compute_frequency_energy_bands(magnitude_spectrum: np.ndarray) -> Dict[str, float]:
    """
    Partition 2D frequency domain into Low, Mid, and High concentric bands.
    Returns fractional energy ratios that sum to 1.0.
    """
    h, w = magnitude_spectrum.shape
    cy, cx = h // 2, w // 2
    max_radius = min(cx, cy)
    
    y, x = np.indices((h, w))
    r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    
    power = np.square(magnitude_spectrum)
    total_energy = float(np.sum(power))
    if total_energy <= 1e-9:
        return {
            "low_frequency_energy": 0.0,
            "mid_frequency_energy": 0.0,
            "high_frequency_energy": 0.0,
            "high_frequency_ratio": 0.0
        }
    
    low_mask = r < (0.2 * max_radius)
    mid_mask = (r >= (0.2 * max_radius)) & (r < (0.6 * max_radius))
    high_mask = r >= (0.6 * max_radius)
    
    low_energy = float(np.sum(power[low_mask]))
    mid_energy = float(np.sum(power[mid_mask]))
    high_energy = float(np.sum(power[high_mask]))
    
    return {
        "low_frequency_energy": float(round(low_energy / total_energy, 4)),
        "mid_frequency_energy": float(round(mid_energy / total_energy, 4)),
        "high_frequency_energy": float(round(high_energy / total_energy, 4)),
        "high_frequency_ratio": float(round(high_energy / total_energy, 4))
    }

def visualize_fft_spectrum(magnitude_spectrum: np.ndarray) -> np.ndarray:
    """
    Map magnitude spectrum to high-contrast VIRIDIS / JET colormap for frontend display.
    """
    norm = cv2.normalize(magnitude_spectrum, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    norm_uint8 = norm.astype(np.uint8)
    
    # Apply JET or VIRIDIS colormap
    colored = cv2.applyColorMap(norm_uint8, cv2.COLORMAP_VIRIDIS)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

def analyze_fft_pipeline(rgb_image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any], List[float]]:
    """
    Full FFT analysis pipeline.
    Takes RGB image, computes 2D FFT, calculates spectral energy distribution,
    computes radial frequency profile, and returns visualization and metrics.
    """
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    _, magnitude_spectrum = compute_fft_spectrum(gray)
    
    bands = compute_frequency_energy_bands(magnitude_spectrum)
    entropy = compute_spectral_entropy(magnitude_spectrum)
    radial_curve = compute_radial_profile(magnitude_spectrum, num_bins=40)
    
    vis_spectrum = visualize_fft_spectrum(magnitude_spectrum)
    
    metrics = {
        **bands,
        "spectral_entropy": float(round(entropy, 4))
    }
    
    return vis_spectrum, metrics, [float(x) for x in radial_curve]
