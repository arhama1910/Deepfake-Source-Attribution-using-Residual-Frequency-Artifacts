import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.forensics.face_detection import detect_and_align_face
from app.forensics.residual import extract_residual_pipeline
from app.forensics.fft_analysis import analyze_fft_pipeline
from app.forensics.dct_analysis import analyze_dct_pipeline
from app.storage.local import storage

def extract_video_metadata(video_path: Path) -> Dict[str, Any]:
    """Extract fundamental video stream parameters."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Unable to open video stream at {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    duration = total_frames / fps if fps > 0 else 0.0
    
    return {
        "total_frames": total_frames,
        "fps": round(fps, 2),
        "duration": round(duration, 2),
        "resolution": f"{width}x{height}",
        "width": width,
        "height": height
    }

def process_video_frames(
    video_path: Path,
    analysis_id: str,
    num_samples: int = 16
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Sample num_samples frames uniformly from the video.
    Run face detection, residual extraction, FFT, and DCT on each sampled frame.
    Calculates inter-frame temporal consistency statistics.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Unable to read video file at {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if total_frames <= 0:
        cap.release()
        raise ValueError("Video has 0 valid frames.")
        
    # Determine frame indices for uniform sampling
    if total_frames <= num_samples:
        frame_indices = list(range(total_frames))
    else:
        frame_indices = np.linspace(0, total_frames - 1, num_samples, dtype=int).tolist()
        
    sampled_results = []
    hf_ratios = []
    spectral_entropies = []
    residual_energies = []
    
    for idx, frame_no in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        aligned_roi, face_found, _, _ = detect_and_align_face(rgb_frame, target_size=384)
        
        # Run forensic sub-pipelines
        vis_res, res_metrics = extract_residual_pipeline(aligned_roi)
        vis_fft, fft_metrics, _ = analyze_fft_pipeline(aligned_roi)
        vis_dct, dct_metrics = analyze_dct_pipeline(aligned_roi)
        
        # Save individual frame artifacts for frame inspector
        frame_thumb_name = f"{analysis_id}_frame_{idx}_thumb.jpg"
        frame_res_name = f"{analysis_id}_frame_{idx}_res.jpg"
        frame_fft_name = f"{analysis_id}_frame_{idx}_fft.jpg"
        frame_dct_name = f"{analysis_id}_frame_{idx}_dct.jpg"
        
        thumb_url = storage.save_image(aligned_roi, frame_thumb_name)
        res_url = storage.save_image(vis_res, frame_res_name)
        fft_url = storage.save_image(vis_fft, frame_fft_name)
        dct_url = storage.save_image(vis_dct, frame_dct_name)
        
        timestamp_sec = round(frame_no / fps, 2)
        
        hf_ratio = fft_metrics["high_frequency_ratio"]
        entropy = fft_metrics["spectral_entropy"]
        res_energy = res_metrics["mean_energy"]
        
        hf_ratios.append(hf_ratio)
        spectral_entropies.append(entropy)
        residual_energies.append(res_energy)
        
        sampled_results.append({
            "frame_number": idx + 1,
            "raw_frame_index": frame_no,
            "timestamp_sec": timestamp_sec,
            "face_detected": face_found,
            "high_frequency_ratio": hf_ratio,
            "spectral_entropy": entropy,
            "residual_energy": res_energy,
            "thumbnail_url": thumb_url,
            "residual_url": res_url,
            "fft_url": fft_url,
            "dct_url": dct_url
        })
        
    cap.release()
    
    if not sampled_results:
        raise ValueError("Failed to extract any valid frames from the video.")
        
    # Calculate temporal stability
    # Temporal variance across consecutive frames: high variance signals synthetic flickering / temporal artifacts
    if len(hf_ratios) > 1:
        hf_diffs = np.diff(hf_ratios)
        temporal_jitter = float(np.std(hf_diffs))
        entropy_variance = float(np.var(spectral_entropies))
        temporal_consistency_score = max(0.0, 1.0 - (temporal_jitter * 4.0))
    else:
        temporal_jitter = 0.0
        entropy_variance = 0.0
        temporal_consistency_score = 1.0
        
    temporal_summary = {
        "sampled_count": len(sampled_results),
        "temporal_jitter": round(temporal_jitter, 5),
        "entropy_variance": round(entropy_variance, 5),
        "temporal_consistency_score": round(temporal_consistency_score, 4),
        "mean_high_freq_ratio": round(float(np.mean(hf_ratios)), 4),
        "mean_spectral_entropy": round(float(np.mean(spectral_entropies)), 4)
    }
    
    return sampled_results, temporal_summary
